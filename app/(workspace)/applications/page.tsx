import type { Metadata } from "next";
import { ApplicationTable } from "@/components/ApplicationTable";
import { connectDB } from "@/lib/db";
import { requirePageStaff } from "@/lib/page-auth";
import { listApplications, listJobs } from "@/lib/queries";

export const metadata: Metadata = { title: "Candidates — Rowan" };

export default async function ApplicationsPage(props: PageProps<"/applications">) {
  await requirePageStaff();
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  await connectDB();
  const [data, jobs] = await Promise.all([
    listApplications(params),
    listJobs(new URLSearchParams("limit=100"), true),
  ]);

  return (
    <ApplicationTable
      data={data}
      params={{
        q: params.get("q") ?? "",
        stage: params.get("stage") ?? "",
        job: params.get("job") ?? "",
        source: params.get("source") ?? "",
        sort: params.get("sort") ?? "newest",
        page: data.page,
      }}
      jobs={jobs.items.map((job) => ({ id: job.id, title: job.title }))}
    />
  );
}
