import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/ApplyForm";
import { ArrowRight, Check, Clock } from "@/components/Icons";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { formatDate, titleCase } from "@/lib/format";
import { getJob } from "@/lib/queries";

export const metadata: Metadata = { title: "Role details — Rowan" };

export default async function JobDetailPage(props: PageProps<"/jobs/[id]">) {
  const { id } = await props.params;
  await connectDB();
  const user = await getCurrentUser();
  const staff = Boolean(user && ["recruiter", "admin"].includes(user.role));
  const job = await getJob(id, staff);
  if (!job) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/jobs" className="text-sm text-muted hover:text-forest">
        ← All open roles
      </Link>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <article className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
            {job.department}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{job.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip">{job.location}</span>
            <span className="chip">{titleCase(job.employmentType)}</span>
            <span className="chip num">Posted {formatDate(job.createdAt)}</span>
            {job.status !== "open" && <span className="chip">{titleCase(job.status)}</span>}
          </div>

          <div className="mt-8 whitespace-pre-line text-[15px] leading-8 text-ink/85">
            {job.description}
          </div>

          <div className="mt-9 border-t border-line pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Our process
            </h2>
            <ol className="mt-4 space-y-3">
              {[
                ["Application review", "A recruiter reads your application and answers."],
                ["Intro conversation", "A short call about your work and what you want next."],
                ["Team interview", "A practical conversation with people you would work with."],
                ["Decision", "A clear outcome and feedback, whichever way it goes."],
              ].map(([title, detail], index) => (
                <li key={title} className="flex gap-3 text-sm">
                  <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-forest">
                    {index + 1}
                  </span>
                  <span>
                    <strong className="font-semibold">{title}</strong>
                    <span className="text-muted"> — {detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </article>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          {job.status === "open" ? (
            <ApplyForm jobId={job.id} questions={job.questions} />
          ) : (
            <div className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-clay">
                <Clock />
              </span>
              <h2 className="mt-4 text-lg font-semibold">This role is no longer accepting applications</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Browse our other open roles — new teams are added regularly.
              </p>
              <Link href="/jobs" className="btn-secondary mt-5">
                See open roles <ArrowRight width={16} height={16} />
              </Link>
            </div>
          )}
          <div className="mt-4 card p-5 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <Check width={17} height={17} className="text-forest" />
              Thoughtful hiring
            </p>
            <p className="mt-2 leading-6 text-muted">
              We keep interviews focused on the work and give you a decision within five working days
              of your final conversation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
