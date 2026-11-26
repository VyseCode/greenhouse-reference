import type { JobStatus, OfferStatus, Stage } from "@/lib/constants";
import { titleCase } from "@/lib/format";

const stageStyles: Record<Stage, string> = {
  applied: "bg-[#eef1f2] text-[#45565f] border-[#d8e0e3]",
  screen: "bg-[#eaf1f7] text-[#2f5f86] border-[#d4e3f0]",
  interview: "bg-[#fbf0dd] text-[#8a5a1e] border-[#efdcb8]",
  offer: "bg-[#fbe9df] text-[#a34b2a] border-[#f0d2c3]",
  hired: "bg-[#e2f1e8] text-[#1c6646] border-[#c6e3d2]",
  rejected: "bg-[#f4e9e7] text-[#94443a] border-[#ecd4d0]",
};

const jobStyles: Record<JobStatus, string> = {
  draft: "bg-[#eef1f2] text-[#45565f] border-[#d8e0e3]",
  open: "bg-[#e2f1e8] text-[#1c6646] border-[#c6e3d2]",
  closed: "bg-[#f4e9e7] text-[#94443a] border-[#ecd4d0]",
};

const offerStyles: Record<OfferStatus, string> = {
  draft: "bg-[#eef1f2] text-[#45565f] border-[#d8e0e3]",
  sent: "bg-[#eaf1f7] text-[#2f5f86] border-[#d4e3f0]",
  accepted: "bg-[#e2f1e8] text-[#1c6646] border-[#c6e3d2]",
  declined: "bg-[#f4e9e7] text-[#94443a] border-[#ecd4d0]",
};

function Badge({ label, style }: { label: string; style: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <Badge label={titleCase(stage)} style={stageStyles[stage]} />;
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge label={titleCase(status)} style={jobStyles[status]} />;
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <Badge label={titleCase(status)} style={offerStyles[status]} />;
}
