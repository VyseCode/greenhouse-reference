import { handleError, ok, requireStaff } from "@/lib/api";
import { listInterviewers } from "@/lib/queries";

export async function GET() {
  try {
    await requireStaff();
    return ok({ interviewers: await listInterviewers() });
  } catch (error) {
    return handleError(error);
  }
}
