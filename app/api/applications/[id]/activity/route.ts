import { ApiError, handleError, ok, parseId, pagination, requireStaff } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { listActivity } from "@/lib/queries";
import { Application } from "@/models/Application";

type Ctx = RouteContext<"/api/applications/[id]/activity">;

export async function GET(request: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    parseId(id, "application id");
    await connectDB();
    if (!(await Application.exists({ _id: id }))) {
      throw new ApiError(404, "Application not found");
    }
    const { searchParams } = new URL(request.url);
    const { page, limit } = pagination(searchParams, 20);
    return ok(await listActivity(id, page, limit));
  } catch (error) {
    return handleError(error);
  }
}
