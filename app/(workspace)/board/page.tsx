import type { Metadata } from "next";
import { PipelineBoard } from "@/components/PipelineBoard";
import { ACTIVE_STAGES, type Stage } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { requirePageStaff } from "@/lib/page-auth";
import { listApplications } from "@/lib/queries";

export const metadata: Metadata = { title: "Pipeline — Rowan" };

export default async function BoardPage() {
  await requirePageStaff();
  await connectDB();
  const stages: Stage[] = [...ACTIVE_STAGES, "rejected"];
  const columns = await Promise.all(
    stages.map(async (stage) => {
      const result = await listApplications(new URLSearchParams({ stage, limit: "100" }));
      return { stage, items: result.items, total: result.total };
    }),
  );
  return <PipelineBoard columns={columns} />;
}
