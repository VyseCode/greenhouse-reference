import { handleError, ok, readJson, requireStaff } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { listJobs } from "@/lib/queries";
import { createJobSchema } from "@/lib/validators";
import { Job } from "@/models/Job";

export async function GET(request: Request) {
  try {
    await connectDB();
    const user = await getCurrentUser();
    const staff = Boolean(user && ["recruiter", "admin"].includes(user.role));
    const { searchParams } = new URL(request.url);
    return ok(await listJobs(searchParams, staff));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireStaff();
    const body = createJobSchema.parse(await readJson(request));
    await connectDB();
    const job = await Job.create({
      ...body,
      createdBy: user.id,
      applicantsCount: 0,
    });
    return ok({ job: { ...job.toObject(), id: job._id.toString() } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
