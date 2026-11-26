import { ApiError, handleError, ok, parseId, requireStaff } from "@/lib/api";
import { getApplicationDetail } from "@/lib/queries";

type Ctx = RouteContext<"/api/applications/[id]">;

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    parseId(id, "application id");
    const application = await getApplicationDetail(id, true);
    if (!application) throw new ApiError(404, "Application not found");
    return ok({ application });
  } catch (error) {
    return handleError(error);
  }
}
