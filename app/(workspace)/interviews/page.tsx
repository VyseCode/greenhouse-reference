import type { Metadata } from "next";
import { InterviewList } from "@/components/InterviewList";
import { STAFF_ROLES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { requirePageUser } from "@/lib/page-auth";
import { listInterviews } from "@/lib/queries";

export const metadata: Metadata = { title: "Interviews — Rowan" };

export default async function InterviewsPage(props: PageProps<"/interviews">) {
  const user = await requirePageUser();
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  await connectDB();
  const data = await listInterviews(params, user.id, STAFF_ROLES.includes(user.role));
  return <InterviewList data={data} params={{ status: params.get("status") ?? "", page: data.page }} />;
}
