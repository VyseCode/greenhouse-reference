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
import { MAX_STAGE_HISTORY } from "@/lib/constants";
import { offerSchema } from "@/lib/validators";
import { Activity } from "@/models/Activity";
import { Application } from "@/models/Application";
import { Job } from "@/models/Job";
import { Offer } from "@/models/Offer";

type Ctx = RouteContext<"/api/applications/[id]/offer">;

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireStaff();
    const { id } = await ctx.params;
    parseId(id, "application id");
    const body = offerSchema.parse(await readJson(request));
    if (Number.isNaN(new Date(`${body.startDate}T00:00:00Z`).getTime())) {
      throw new ApiError(400, "Enter a valid start date");
    }
    await connectDB();

    const application = await Application.findById(id).select("job name stage email").lean();
    if (!application) throw new ApiError(404, "Application not found");
    if (application.stage === "rejected") {
      throw new ApiError(409, "An offer cannot be made to a rejected candidate");
    }
    if (await Offer.exists({ application: id })) {
      throw new ApiError(409, "An offer already exists for this candidate");
    }

    let offer;
    try {
      offer = await Offer.create({
        application: new Types.ObjectId(id),
        job: application.job,
        salary: body.salary,
        startDate: body.startDate,
        status: "draft",
        note: body.note,
      });
    } catch (error) {
      const code = (error as Error & { code?: number }).code;
      if (code === 11000) throw new ApiError(409, "An offer already exists for this candidate");
      throw error;
    }

    if (application.stage !== "offer" && application.stage !== "hired") {
      const event = {
        from: application.stage,
        to: "offer",
        reason: "Offer created",
        actor: user.name,
        at: new Date(),
      };
      await Application.updateOne(
        { _id: id, stage: application.stage },
        {
          $set: { stage: "offer" },
          $push: { stageHistory: { $each: [event], $slice: -MAX_STAGE_HISTORY } },
        },
      );
    }

    const job = await Job.findById(application.job).select("title").lean();
    await Promise.all([
      Activity.create({
        application: new Types.ObjectId(id),
        actor: user.name,
        type: "offer",
        message: `Offer created for ${application.name} at ${body.salary.toLocaleString()}`,
        meta: { salary: body.salary, startDate: body.startDate, status: "draft" },
      }),
      notifications.offerUpdated({
        candidateEmail: application.email,
        candidateName: application.name,
        jobTitle: job?.title ?? "a role",
        status: "draft",
      }),
    ]);

    return ok({ offer: { id: offer._id.toString(), status: offer.status } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
