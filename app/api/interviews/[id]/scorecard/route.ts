import {
  ApiError,
  handleError,
  ok,
  parseId,
  readJson,
  requireUser,
} from "@/lib/api";
import { STAFF_ROLES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { getInterview } from "@/lib/queries";
import { scorecardSchema } from "@/lib/validators";
import { Activity } from "@/models/Activity";
import { Interview } from "@/models/Interview";
import { Scorecard } from "@/models/Scorecard";

type Ctx = RouteContext<"/api/interviews/[id]/scorecard">;

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    parseId(id, "interview id");
    await connectDB();
    const isStaff = STAFF_ROLES.includes(user.role);
    const result = await getInterview(id, user.id, isStaff);
    if (!result.interview) throw new ApiError(404, "Interview not found");

    const scorecard = await Scorecard.findOne({ interview: id })
      .select("criteria weightedScore note submittedAt interviewer")
      .lean();
    if (!scorecard) throw new ApiError(404, "No scorecard has been submitted");
    return ok({ scorecard: { ...scorecard, id: scorecard._id.toString() } });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    parseId(id, "interview id");
    const body = scorecardSchema.parse(await readJson(request));
    await connectDB();

    const interview = await Interview.findById(id)
      .select("application interviewer status")
      .lean();
    if (!interview) throw new ApiError(404, "Interview not found");
    if (interview.interviewer.toString() !== user.id) {
      throw new ApiError(403, "You are not assigned to this interview");
    }
    if (interview.status === "cancelled") {
      throw new ApiError(409, "A cancelled interview cannot be scored");
    }
    if (await Scorecard.exists({ interview: id })) {
      throw new ApiError(409, "A scorecard has already been submitted for this interview");
    }

    const weightSum = body.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    const weightedScore =
      body.criteria.reduce(
        (sum, criterion) => sum + criterion.weight * criterion.rating,
        0,
      ) / weightSum;

    let scorecard;
    try {
      scorecard = await Scorecard.create({
        interview: interview._id,
        application: interview.application,
        interviewer: interview.interviewer,
        criteria: body.criteria,
        weightedScore: Math.round(weightedScore * 100) / 100,
        note: body.note,
        submittedAt: new Date(),
      });
    } catch (error) {
      const code = (error as Error & { code?: number }).code;
      if (code === 11000) {
        throw new ApiError(409, "A scorecard has already been submitted for this interview");
      }
      throw error;
    }

    await Activity.create({
      application: interview.application,
      actor: user.name,
      type: "scorecard",
      message: `Scorecard submitted with weighted score ${scorecard.weightedScore.toFixed(2)}`,
      meta: { interviewId: id, weightedScore: scorecard.weightedScore },
    });

    return ok(
      { scorecard: { id: scorecard._id.toString(), weightedScore: scorecard.weightedScore } },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
