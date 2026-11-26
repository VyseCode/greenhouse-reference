import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobEditor } from "@/components/JobEditor";
import { connectDB } from "@/lib/db";
import { requirePageStaff } from "@/lib/page-auth";
import { getJob } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit job — Rowan" };

export default async function EditJobPage(props: PageProps<"/jobs/[id]/edit">) {
  await requirePageStaff();
  const { id } = await props.params;
  await connectDB();
  const job = await getJob(id, true);
  if (!job) notFound();
  return <JobEditor job={job} />;
}
