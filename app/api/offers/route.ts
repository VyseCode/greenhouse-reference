import { handleError, ok, requireStaff } from "@/lib/api";
import { listOffers } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    await requireStaff();
    const { searchParams } = new URL(request.url);
    return ok(await listOffers(searchParams));
  } catch (error) {
    return handleError(error);
  }
}
