import { z } from "zod";
import {
  ApiError,
  handleError,
  ok,
  parseId,
  readJson,
  requireStaff,
  requireUser,
} from "@/lib/api";
import { STAFF_ROLES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { getInterview } from "@/lib/queries";
import { Activity } from "@/models/Activity";
import { Interview } from "@/models/Interview";

type Ctx = RouteContext<"/api/interviews/[id]">;

const updateSchema = z.object({
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
  scheduledAt: z.string().refine((v) => !Number.isNaN(Date.parse(v))).optional(),
  note: z.string().trim().max(2000).optional(),
});

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    parseId(id, "interview id");
    await connectDB();
    const isStaff = STAFF_ROLES.includes(user.role);
    const result = await getInterview(id, user.id, isStaff);
    if (!result.interview) throw new ApiError(404, "Interview not found");
    return ok({ interview: result.interview, canScorecard: result.assigned });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const user = await requireStaff();
    const { id } = await ctx.params;
    parseId(id, "interview id");
    const body = updateSchema.parse(await readJson(request));
    if (!Object.keys(body).length) throw new ApiError(400, "Nothing to update");
    await connectDB();

    const set: Record<string, unknown> = { ...body };
    if (body.scheduledAt) {
      const date = new Date(body.scheduledAt);
      if (date.getTime() <= Date.now()) throw new ApiError(400, "Choose a time in the future");
      set.scheduledAt = date;
    }
    const interview = await Interview.findByIdAndUpdate(
      id,
      { $set: set },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!interview) throw new ApiError(404, "Interview not found");

    await Activity.create({
      application: interview.application,
      actor: user.name,
      type: "interview",
      message: `Interview updated to ${interview.status}`,
      meta: { status: interview.status },
    });

    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
