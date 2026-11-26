import { ApiError, handleError, ok, parseId, requireStaff } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { listApplications } from "@/lib/queries";
import { Job } from "@/models/Job";

type Ctx = RouteContext<"/api/jobs/[id]/applications">;

export async function GET(request: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    parseId(id, "job id");
    await connectDB();
    if (!(await Job.exists({ _id: id }))) throw new ApiError(404, "Job not found");

    const { searchParams } = new URL(request.url);
    const filtered = new URLSearchParams(searchParams.toString());
    filtered.set("job", id);
    return ok(await listApplications(filtered));
  } catch (error) {
    return handleError(error);
  }
}
