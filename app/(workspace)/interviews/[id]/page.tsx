import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InterviewDetail } from "@/components/InterviewDetail";
import { STAFF_ROLES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { requirePageUser } from "@/lib/page-auth";
import { getInterview } from "@/lib/queries";
import type { ScorecardDTO } from "@/lib/types";
import { Scorecard } from "@/models/Scorecard";
import { User } from "@/models/User";

export const metadata: Metadata = { title: "Interview — Rowan" };

export default async function InterviewPage(props: PageProps<"/interviews/[id]">) {
  const user = await requirePageUser();
  const { id } = await props.params;
  await connectDB();
  const isStaff = STAFF_ROLES.includes(user.role);
  const result = await getInterview(id, user.id, isStaff);
  if (!result.interview) notFound();

  const doc = await Scorecard.findOne({ interview: id })
    .select("interview criteria weightedScore note submittedAt interviewer")
    .lean();
  const userDoc = doc
    ? await User.findById(doc.interviewer).select("name").lean()
    : null;
  const scorecard: ScorecardDTO | null = doc
    ? {
        id: doc._id.toString(),
        interviewId: doc.interview.toString(),
        criteria: doc.criteria,
        weightedScore: doc.weightedScore,
        note: doc.note,
        submittedAt: doc.submittedAt.toISOString(),
        interviewerName: (userDoc as { name: string } | null)?.name ?? "Unknown",
      }
    : null;

  return (
    <InterviewDetail
      interview={result.interview}
      canScorecard={result.assigned}
      canManage={isStaff}
      scorecard={scorecard}
    />
  );
}
