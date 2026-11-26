import {
  ApiError,
  handleError,
  ok,
  parseId,
  readJson,
  requireAdmin,
  requireStaff,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getJob } from "@/lib/queries";
import { updateJobSchema } from "@/lib/validators";
import { Job } from "@/models/Job";

type Ctx = RouteContext<"/api/jobs/[id]">;

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    parseId(id, "job id");
    await connectDB();
    const user = await getCurrentUser();
    const staff = Boolean(user && ["recruiter", "admin"].includes(user.role));
    const job = await getJob(id, staff);
    if (!job) throw new ApiError(404, "Job not found");
    return ok({ job });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    parseId(id, "job id");
    const body = updateJobSchema.parse(await readJson(request));
    await connectDB();

    const job = await Job.findByIdAndUpdate(
      id,
      { $set: body },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!job) throw new ApiError(404, "Job not found");
    return ok({ job: { ...job, id: job._id.toString() } });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    parseId(id, "job id");
    await connectDB();

    const job = await Job.findById(id).select("applicantsCount").lean();
    if (!job) throw new ApiError(404, "Job not found");
    if (job.applicantsCount > 0) {
      throw new ApiError(409, "A job with applications cannot be deleted");
    }
    await Job.deleteOne({ _id: id });
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
