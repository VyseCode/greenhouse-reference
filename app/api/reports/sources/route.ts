import { handleError, ok, requireStaff } from "@/lib/api";
import { getSources } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    await requireStaff();
    const { searchParams } = new URL(request.url);
    return ok({ sources: await getSources(searchParams.get("job") ?? undefined) });
  } catch (error) {
    return handleError(error);
  }
}
