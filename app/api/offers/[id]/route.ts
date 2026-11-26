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
import { offerStatusSchema } from "@/lib/validators";
import { Activity } from "@/models/Activity";
import { Application } from "@/models/Application";
import { Job } from "@/models/Job";
import { Offer } from "@/models/Offer";

type Ctx = RouteContext<"/api/offers/[id]">;

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const user = await requireStaff();
    const { id } = await ctx.params;
    parseId(id, "offer id");
    const body = offerStatusSchema.parse(await readJson(request));
    await connectDB();

    const offer = await Offer.findById(id)
      .select("application job status salary")
      .lean();
    if (!offer) throw new ApiError(404, "Offer not found");

    const [application, job] = await Promise.all([
      Application.findById(offer.application).select("name email stage").lean(),
      Job.findById(offer.job).select("title").lean(),
    ]);
    if (!application) throw new ApiError(404, "Application not found");

    await Offer.updateOne(
      { _id: id },
      { $set: { status: body.status, note: body.note || offer.note } },
    );

    if (body.status === "accepted" || body.status === "declined") {
      const target = body.status === "accepted" ? "hired" : "rejected";
      const reason = body.status === "declined" ? "Offer declined" : "";
      if (application.stage !== target) {
        const event = {
          from: application.stage,
          to: target,
          reason,
          actor: user.name,
          at: new Date(),
        };
        await Application.updateOne(
          { _id: offer.application },
          {
            $set: { stage: target, rejectionReason: reason },
            $push: { stageHistory: { $each: [event], $slice: -MAX_STAGE_HISTORY } },
          },
        );
      }
    }

    await Promise.all([
      Activity.create({
        application: offer.application,
        actor: user.name,
        type: "offer",
        message: `Offer status changed to ${body.status}`,
        meta: { status: body.status, offerId: id },
      }),
      notifications.offerUpdated({
        candidateEmail: application.email,
        candidateName: application.name,
        jobTitle: job?.title ?? "a role",
        status: body.status,
      }),
    ]);

    return ok({ status: body.status });
  } catch (error) {
    return handleError(error);
  }
}
