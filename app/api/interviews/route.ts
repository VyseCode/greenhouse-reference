import { handleError, ok, requireUser } from "@/lib/api";
import { STAFF_ROLES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { listInterviews } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await connectDB();
    const isStaff = STAFF_ROLES.includes(user.role);
    const { searchParams } = new URL(request.url);
    return ok(await listInterviews(searchParams, user.id, isStaff));
  } catch (error) {
    return handleError(error);
  }
}
