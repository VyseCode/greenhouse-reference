import type { Metadata } from "next";
import { ReportsView } from "@/components/ReportsView";
import { connectDB } from "@/lib/db";
import { requirePageStaff } from "@/lib/page-auth";
import { getFunnel, getSources, getTimeToHire, listJobs } from "@/lib/queries";

export const metadata: Metadata = { title: "Reports — Rowan" };

export default async function ReportsPage(props: PageProps<"/reports">) {
  await requirePageStaff();
  const searchParams = await props.searchParams;
  const job = typeof searchParams.job === "string" ? searchParams.job : "";
  await connectDB();
  const [jobs, funnel, time, sources] = await Promise.all([
    listJobs(new URLSearchParams("limit=100"), true),
    getFunnel(job),
    getTimeToHire(job),
    getSources(job),
  ]);

  return (
    <ReportsView
      jobs={jobs.items.map((item) => ({ id: item.id, title: item.title }))}
      selectedJob={job}
      initialFunnel={funnel}
      initialTime={time}
      initialSources={sources}
    />
  );
}
