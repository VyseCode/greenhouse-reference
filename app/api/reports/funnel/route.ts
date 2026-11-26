import { handleError, ok, requireStaff } from "@/lib/api";
import { getFunnel } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    await requireStaff();
    const { searchParams } = new URL(request.url);
    return ok({ funnel: await getFunnel(searchParams.get("job") ?? undefined) });
  } catch (error) {
    return handleError(error);
  }
}
