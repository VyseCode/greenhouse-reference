"use client";

import Link from "next/link";
import { useState } from "react";
import { StageBadge } from "@/components/Badges";
import { CandidateWorkflow } from "@/components/CandidateWorkflow";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  Mail,
  Star,
  Tag,
} from "@/components/Icons";
import { STAGES } from "@/lib/constants";
import { formatDate, formatDateTime, titleCase } from "@/lib/format";
import type { ApplicationDetail } from "@/lib/types";

export function CandidateDetail({
  application,
  canManage,
}: {
  application: ApplicationDetail;
  canManage: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const stageIndex = STAGES.indexOf(application.stage);

  return (
    <div className="space-y-6">
      <Link href="/applications" className="text-sm text-muted hover:text-forest">
        ← All candidates
      </Link>

      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{application.name}</h1>
              <StageBadge stage={application.stage} />
            </div>
            <p className="mt-1.5 text-sm text-muted">
              Applied for <span className="font-medium text-ink">{application.jobTitle}</span> · {formatDate(application.appliedAt)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
              <a href={`mailto:${application.email}`} className="flex items-center gap-1.5 hover:text-forest">
                <Mail width={16} height={16} /> {application.email}
              </a>
              <a href={application.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-forest">
                <FileText width={16} height={16} /> Resume
              </a>
              <span className="flex items-center gap-1.5">
                <Tag width={16} height={16} /> {titleCase(application.source)}
              </span>
            </div>
          </div>
        </div>
        {application.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {application.tags.map((tag) => <span key={tag} className="chip">{tag}</span>)}
          </div>
        )}
        {application.rejectionReason && (
          <p className="mt-4 rounded-lg bg-[#fbedeb] px-3 py-2 text-sm text-danger">
            Rejection reason: {application.rejectionReason}
          </p>
        )}
      </header>

      <div className="card p-5">
        <ol className="flex flex-wrap gap-2" aria-label="Pipeline progress">
          {STAGES.filter((stage) => stage !== "rejected").map((stage, index) => {
            const reached = application.stage !== "rejected" && index <= stageIndex;
            return (
              <li
                key={stage}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  reached
                    ? "border-forest bg-sage text-forest-deep"
                    : "border-line bg-paper text-muted"
                }`}
              >
                <span className="num">{index + 1}</span>
                {titleCase(stage)}
              </li>
            );
          })}
          {application.stage === "rejected" && (
            <li className="rounded-full border border-[#ecd4d0] bg-[#f4e9e7] px-3 py-1.5 text-xs font-semibold text-danger">
              Rejected
            </li>
          )}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Section title="Application answers" icon={<FileText width={17} height={17} />}>
            {application.answers.length === 0 ? (
              <Empty text="No additional questions were asked for this role." />
            ) : (
              <dl className="space-y-4">
                {application.answers.map((answer, index) => (
                  <div key={index}>
                    <dt className="text-sm font-medium">{answer.question}</dt>
                    <dd className="mt-1 text-sm leading-6 text-muted">{answer.answer}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Section>

          <Section title="Interviews" icon={<Calendar width={17} height={17} />}>
            {application.interviews.length === 0 ? (
              <Empty text="No interviews scheduled for this candidate yet." />
            ) : (
              <ul className="space-y-3">
                {application.interviews.map((interview) => (
                  <li key={interview.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2.5 text-sm">
                    <span>
                      <strong className="font-medium">{titleCase(interview.status)}</strong>
                      <span className="text-muted"> · {interview.interviewerName}</span>
                    </span>
                    <span className="num flex items-center gap-1.5 text-xs text-muted">
                      <Clock width={14} height={14} /> {formatDateTime(interview.scheduledAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Scorecards" icon={<Star width={17} height={17} />}>
            {application.scorecards.length === 0 ? (
              <Empty text="No scorecards submitted yet." />
            ) : (
              <ul className="space-y-3">
                {application.scorecards.map((scorecard) => (
                  <li key={scorecard.id} className="rounded-lg border border-line p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <strong className="font-medium">{scorecard.interviewerName}</strong>
                      <span className="num rounded-full bg-sage px-2.5 py-1 text-xs font-semibold text-forest-deep">
                        {scorecard.weightedScore.toFixed(2)} / 5
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {scorecard.criteria.map((criterion) => (
                        <span key={criterion.name} className="text-xs text-muted">
                          {criterion.name}: <span className="num font-semibold text-ink">{criterion.rating}</span> ×{criterion.weight}
                        </span>
                      ))}
                    </div>
                    {scorecard.note && <p className="mt-2 text-sm leading-6 text-muted">{scorecard.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Offer" icon={<ArrowRight width={17} height={17} />}>
            {application.offer ? (
              <div className="rounded-lg border border-line p-4 text-sm">
                <p className="font-medium">
                  {titleCase(application.offer.status)} · ${application.offer.salary.toLocaleString()} · starts {formatDate(application.offer.startDate)}
                </p>
                {application.offer.note && <p className="mt-2 text-muted">{application.offer.note}</p>}
              </div>
            ) : (
              <Empty text="No offer has been made for this candidate." />
            )}
          </Section>
        </div>

        <aside className="space-y-6">
          <CandidateWorkflow application={application} canManage={canManage} />

          <Section title="Stage history" icon={<Clock width={17} height={17} />}>
            <ol className="space-y-3">
              {application.stageHistory.map((event, index) => (
                <li key={index} className="relative pl-5 text-sm">
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-forest" />
                  <p className="font-medium">{titleCase(event.to)}</p>
                  <p className="text-xs text-muted">{event.actor} · {formatDateTime(event.at)}</p>
                  {event.reason && <p className="mt-0.5 text-xs text-muted">{event.reason}</p>}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Activity" icon={<FileText width={17} height={17} />}>
            {application.activity.length === 0 ? (
              <Empty text="Nothing has happened on this application yet." />
            ) : (
              <ul className="space-y-3">
                {application.activity.map((item) => (
                  <li key={item.id} className="text-sm">
                    <p>{item.message}</p>
                    <p className="text-xs text-muted">{item.actor} · {formatDateTime(item.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            {application.activity.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory((value) => !value)}
                className="mt-4 flex items-center gap-1 text-sm font-semibold text-forest hover:underline"
              >
                {showHistory ? "Hide detail" : "Show detail"}
                <ChevronDown width={15} height={15} className={showHistory ? "rotate-180" : ""} />
              </button>
            )}
            {showHistory && (
              <pre className="mt-3 overflow-x-auto rounded-lg bg-paper p-3 text-[11px] text-muted">
                {JSON.stringify(application.activity.map((a) => a.meta), null, 2)}
              </pre>
            )}
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <span className="text-forest">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-line px-4 py-5 text-sm text-muted">{text}</p>;
}
