import type { Metadata } from "next";
import { JobBoard } from "@/components/JobBoard";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { listJobs } from "@/lib/queries";
import { Job } from "@/models/Job";

export const metadata: Metadata = { title: "Open roles — Rowan" };

export default async function JobsPage(props: PageProps<"/jobs">) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }

  await connectDB();
  const user = await getCurrentUser();
  const staff = Boolean(user && ["recruiter", "admin"].includes(user.role));
  const [data, departments] = await Promise.all([
    listJobs(params, staff),
    Job.distinct("department", { status: "open" }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-9 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
          Careers at Rowan
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Find work worth doing.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          We hire slowly and deliberately. Every role below is open, has a real team behind it, and
          comes with a clear process — you will always know what happens next.
        </p>
      </div>
      <JobBoard
        data={data}
        departments={departments as string[]}
        params={{
          q: params.get("q") ?? "",
          department: params.get("department") ?? "",
          sort: params.get("sort") ?? "newest",
          page: data.page,
        }}
      />
    </div>
  );
}
