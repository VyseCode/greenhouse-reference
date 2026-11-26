import { handleError, ok, requireUser } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    return ok({ user });
  } catch (error) {
    return handleError(error);
  }
}
