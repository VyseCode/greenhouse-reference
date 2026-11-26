import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CandidateDetail } from "@/components/CandidateDetail";
import { connectDB } from "@/lib/db";
import { requirePageStaff } from "@/lib/page-auth";
import { getApplicationDetail, listInterviewers } from "@/lib/queries";

export const metadata: Metadata = { title: "Candidate — Rowan" };

export default async function CandidatePage(props: PageProps<"/applications/[id]">) {
  await requirePageStaff();
  const { id } = await props.params;
  await connectDB();
  const [application, interviewers] = await Promise.all([
    getApplicationDetail(id, true),
    listInterviewers(),
  ]);
  if (!application) notFound();
  return <CandidateDetail application={application} interviewers={interviewers} canManage />;
}
