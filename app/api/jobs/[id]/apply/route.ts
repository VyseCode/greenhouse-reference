import {
  ApiError,
  handleError,
  ok,
  parseId,
  readJson,
} from "@/lib/api";
import { notifications } from "@/lib/adapters/notifications";
import { resumeStorage } from "@/lib/adapters/storage";
import { connectDB } from "@/lib/db";
import { getJob } from "@/lib/queries";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { applySchema } from "@/lib/validators";
import { Activity } from "@/models/Activity";
import { Application } from "@/models/Application";
import { Job } from "@/models/Job";

type Ctx = RouteContext<"/api/jobs/[id]/apply">;

export async function POST(request: Request, ctx: Ctx) {
  try {
    const limit = rateLimit(`apply:${clientIp(request)}`, 10, 10 * 60 * 1000);
    if (!limit.allowed) {
      return handleError(new ApiError(429, `Too many applications. Try again in ${limit.retryAfter}s.`));
    }

    const { id } = await ctx.params;
    parseId(id, "job id");
    const body = applySchema.parse(await readJson(request));
    await connectDB();

    const job = await getJob(id, true);
    if (!job) throw new ApiError(404, "Job not found");
    if (job.status !== "open") {
      throw new ApiError(409, "This job is not accepting applications");
    }

    const byPrompt = new Map(body.answers.map((a) => [a.question, a.answer]));
    for (const question of job.questions) {
      if (question.required && !byPrompt.has(question.prompt)) {
        throw new ApiError(400, `Please answer: ${question.prompt}`);
      }
    }
    for (const answer of body.answers) {
      if (!job.questions.some((q) => q.prompt === answer.question)) {
        throw new ApiError(400, `Unexpected answer for: ${answer.question}`);
      }
    }

    const resumeUrl = await resumeStorage.normalize(body.resumeUrl);
    if (await Application.exists({ job: id, email: body.email })) {
      throw new ApiError(409, "You have already applied to this job");
    }

    let application;
    try {
      application = await Application.create({
        job: id,
        name: body.name,
        email: body.email,
        resumeUrl,
        answers: body.answers,
        source: body.source,
        stage: "applied",
        appliedAt: new Date(),
        stageHistory: [
          { from: null, to: "applied", reason: "", actor: "candidate", at: new Date() },
        ],
      });
    } catch (error) {
      const code = (error as Error & { code?: number }).code;
      if (code === 11000) {
        throw new ApiError(409, "You have already applied to this job");
      }
      throw error;
    }

    await Promise.all([
      Job.updateOne({ _id: id }, { $inc: { applicantsCount: 1 } }),
      Activity.create({
        application: application._id,
        actor: "candidate",
        type: "application",
        message: `${body.name} applied for ${job.title}`,
        meta: { source: body.source, stage: "applied" },
      }),
      notifications.applicationReceived({
        candidateName: body.name,
        candidateEmail: body.email,
        jobTitle: job.title,
      }),
    ]);

    return ok(
      { application: { id: application._id.toString(), name: application.name, stage: application.stage } },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
