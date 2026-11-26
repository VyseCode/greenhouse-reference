import { Types } from "mongoose";
import {
  ApiError,
  handleError,
  ok,
  parseId,
  readJson,
  requireStaff,
} from "@/lib/api";
import { notifications } from "@/lib/adapters/notifications";
import { connectDB } from "@/lib/db";
import { interviewSchema } from "@/lib/validators";
import { Activity } from "@/models/Activity";
import { Application } from "@/models/Application";
import { Interview } from "@/models/Interview";
import { User } from "@/models/User";

type Ctx = RouteContext<"/api/applications/[id]/interviews">;

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireStaff();
    const { id } = await ctx.params;
    parseId(id, "application id");
    const body = interviewSchema.parse(await readJson(request));
    if (!Types.ObjectId.isValid(body.interviewerId)) {
      throw new ApiError(400, "Choose a valid interviewer");
    }
    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      throw new ApiError(400, "Choose a time in the future");
    }
    await connectDB();

    const application = await Application.findById(id).select("job name stage").lean();
    if (!application) throw new ApiError(404, "Application not found");
    if (application.stage === "rejected") {
      throw new ApiError(409, "Cannot schedule an interview for a rejected candidate");
    }
    const interviewer = await User.findById(body.interviewerId)
      .select("name email role")
      .lean();
    if (!interviewer || interviewer.role !== "interviewer") {
      throw new ApiError(400, "Choose a valid interviewer");
    }

    const interview = await Interview.create({
      application: new Types.ObjectId(id),
      job: application.job,
      interviewer: new Types.ObjectId(body.interviewerId),
      scheduledAt,
      durationMinutes: body.durationMinutes,
      note: body.note,
      status: "scheduled",
    });

    await Promise.all([
      Activity.create({
        application: new Types.ObjectId(id),
        actor: user.name,
        type: "interview",
        message: `Interview scheduled with ${interviewer.name} for ${application.name}`,
        meta: { interviewerId: body.interviewerId, scheduledAt: scheduledAt.toISOString() },
      }),
      notifications.interviewScheduled({
        interviewerEmail: interviewer.email,
        candidateName: application.name,
        jobTitle: "an open role",
        scheduledAt: scheduledAt.toISOString(),
      }),
    ]);

    return ok(
      {
        interview: {
          id: interview._id.toString(),
          applicationId: id,
          interviewerId: body.interviewerId,
          scheduledAt: interview.scheduledAt.toISOString(),
          status: interview.status,
        },
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
