import { Types } from "mongoose";
import {
  ApiError,
  handleError,
  ok,
  parseId,
  readJson,
  requireStaff,
} from "@/lib/api";
import { connectDB } from "@/lib/db";
import { MAX_STAGE_HISTORY, STAGE_ORDER } from "@/lib/constants";
import { rejectionSchema, stageSchema } from "@/lib/validators";
import { Activity } from "@/models/Activity";
import { Application } from "@/models/Application";

type Ctx = RouteContext<"/api/applications/[id]/stage">;

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireStaff();
    const { id } = await ctx.params;
    parseId(id, "application id");
    const body = stageSchema.parse(await readJson(request));
    await connectDB();

    const current = await Application.findById(id)
      .select("stage rejectionReason job name")
      .lean();
    if (!current) throw new ApiError(404, "Application not found");
    if (current.stage === body.stage) {
      throw new ApiError(400, "The candidate is already at that stage");
    }

    if (body.stage === "rejected") {
      rejectionSchema.parse({ reason: body.reason });
    } else if (
      STAGE_ORDER[body.stage] < STAGE_ORDER[current.stage] &&
      !body.reason
    ) {
      throw new ApiError(400, "A reason is required when moving a candidate backwards");
    }

    const event = {
      from: current.stage,
      to: body.stage,
      reason: body.reason,
      actor: user.name,
      at: new Date(),
    };
    const result = await Application.updateOne(
      { _id: id, stage: current.stage },
      {
        $set: {
          stage: body.stage,
          rejectionReason: body.stage === "rejected" ? body.reason : "",
        },
        $push: { stageHistory: { $each: [event], $slice: -MAX_STAGE_HISTORY } },
      },
    );
    if (result.matchedCount === 0) {
      throw new ApiError(409, "This candidate's stage changed. Refresh and try again.");
    }

    await Activity.create({
      application: new Types.ObjectId(id),
      actor: user.name,
      type: "stage",
      message: `${current.name} moved from ${current.stage} to ${body.stage}${body.reason ? `: ${body.reason}` : ""}`,
      meta: { from: current.stage, to: body.stage, reason: body.reason },
    });

    return ok({ stage: body.stage, reason: body.reason });
  } catch (error) {
    return handleError(error);
  }
}
