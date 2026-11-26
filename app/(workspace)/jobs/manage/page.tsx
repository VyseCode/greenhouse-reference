import type { Metadata } from "next";
import { JobManager } from "@/components/JobManager";
import { connectDB } from "@/lib/db";
import { requirePageStaff } from "@/lib/page-auth";
import { listJobs } from "@/lib/queries";

export const metadata: Metadata = { title: "Jobs — Rowan" };

export default async function ManageJobsPage(props: PageProps<"/jobs/manage">) {
  const user = await requirePageStaff();
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  await connectDB();
  const data = await listJobs(params, true);

  return (
    <JobManager
      data={data}
      params={{
        q: params.get("q") ?? "",
        status: params.get("status") ?? "",
        page: data.page,
      }}
      canDelete={user.role === "admin"}
    />
  );
}
