"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, Check, Clock, Star } from "@/components/Icons";
import { formatDateTime, titleCase } from "@/lib/format";
import type { InterviewDTO, ScorecardDTO } from "@/lib/types";

type Criterion = { name: string; weight: number; rating: number };

export function InterviewDetail({
  interview,
  canScorecard,
  canManage,
  scorecard,
}: {
  interview: InterviewDTO;
  canScorecard: boolean;
  canManage: boolean;
  scorecard: ScorecardDTO | null;
}) {
  const router = useRouter();
  const [criteria, setCriteria] = useState<Criterion[]>([
    { name: "Problem solving", weight: 3, rating: 3 },
    { name: "Communication", weight: 2, rating: 3 },
    { name: "Domain expertise", weight: 3, rating: 3 },
    { name: "Collaboration", weight: 2, rating: 3 },
  ]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const weightSum = criteria.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = weightSum
    ? criteria.reduce((sum, c) => sum + c.weight * c.rating, 0) / weightSum
    : 0;

  function update(index: number, patch: Partial<Criterion>) {
    setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/interviews/${interview.id}/scorecard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria, note }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not submit the scorecard");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(status: "completed" | "cancelled") {
    if (status === "cancelled" && !window.confirm("Cancel this interview?")) return;
    setError("");
    const response = await fetch(`/api/interviews/${interview.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) setError(payload.error ?? "Could not update the interview");
    router.refresh();
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/interviews" className="text-sm text-muted hover:text-forest">← All interviews</Link>

      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Interview with {interview.candidateName}
            </h1>
            <p className="mt-1 text-sm text-muted">{interview.jobTitle} · {interview.interviewerName}</p>
          </div>
          <span className="chip">{titleCase(interview.status)}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
          <span className="flex items-center gap-1.5"><Calendar width={16} height={16} /> {formatDateTime(interview.scheduledAt)}</span>
          <span className="flex items-center gap-1.5"><Clock width={16} height={16} /> {interview.durationMinutes} minutes</span>
          <Link href={`/applications/${interview.applicationId}`} className="text-forest hover:underline">View candidate</Link>
        </div>
        {interview.note && <p className="mt-4 rounded-lg bg-paper p-3 text-sm leading-6 text-muted">{interview.note}</p>}
        {canManage && interview.status !== "cancelled" && (
          <div className="mt-5 flex gap-2 border-t border-line pt-4">
            {interview.status === "scheduled" && (
              <button type="button" onClick={() => updateStatus("completed")} className="btn-secondary">Mark completed</button>
            )}
            <button type="button" onClick={() => updateStatus("cancelled")} className="btn-secondary text-danger">Cancel interview</button>
          </div>
        )}
      </header>

      {error && <p role="alert" className="rounded-lg bg-[#fbedeb] px-3 py-2.5 text-sm text-danger">{error}</p>}

      {scorecard ? (
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Star width={18} height={18} className="text-forest" /> Submitted scorecard</h2>
            <span className="num rounded-full bg-sage px-3 py-1 text-sm font-semibold text-forest-deep">
              {scorecard.weightedScore.toFixed(2)} / 5
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">{scorecard.interviewerName} · {formatDateTime(scorecard.submittedAt)}</p>
          <div className="mt-5 space-y-3">
            {scorecard.criteria.map((criterion) => (
              <div key={criterion.name} className="flex items-center justify-between border-b border-line pb-2 text-sm">
                <span>{criterion.name} <span className="text-muted">×{criterion.weight}</span></span>
                <span className="num font-semibold">{criterion.rating} / 5</span>
              </div>
            ))}
          </div>
          {scorecard.note && <p className="mt-4 text-sm leading-6 text-muted">{scorecard.note}</p>}
        </section>
      ) : canScorecard ? (
        <form onSubmit={submit} className="card space-y-5 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Star width={18} height={18} className="text-forest" /> Your scorecard</h2>
            <p className="mt-1 text-sm text-muted">Rate each criterion from 1 to 5. Heavier criteria count more in the weighted score.</p>
          </div>

          <div className="space-y-3">
            {criteria.map((criterion, index) => (
              <div key={index} className="grid items-center gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_100px_120px]">
                <input
                  id={`criterion-${index}`}
                  value={criterion.name}
                  onChange={(event) => update(index, { name: event.target.value })}
                  aria-label={`Name of criterion ${index + 1}`}
                  className="input"
                />
                <div>
                  <label className="sr-only" htmlFor={`weight-${index}`}>Weight for criterion {index + 1}</label>
                  <select
                    id={`weight-${index}`}
                    value={criterion.weight}
                    onChange={(event) => update(index, { weight: Number(event.target.value) })}
                    className="input"
                  >
                    {[1, 2, 3, 4, 5].map((weight) => <option key={weight} value={weight}>Weight {weight}</option>)}
                  </select>
                </div>
                <div>
                  <label className="sr-only" htmlFor={`rating-${index}`}>Rating for criterion {index + 1}</label>
                  <select
                    id={`rating-${index}`}
                    value={criterion.rating}
                    onChange={(event) => update(index, { rating: Number(event.target.value) })}
                    className="input"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="scorecard-note" className="mb-1.5 block text-sm font-medium">Overall note</label>
            <textarea id="scorecard-note" rows={4} value={note} onChange={(event) => setNote(event.target.value)} className="input resize-y" placeholder="What stood out? What would you want to probe next?" />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-sage px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-medium text-forest-deep"><Check width={16} height={16} /> Weighted score</span>
            <span className="num text-xl font-semibold text-forest-deep">{weightedScore.toFixed(2)} / 5</span>
          </div>

          <button type="submit" disabled={busy || criteria.some((c) => c.name.trim().length < 2)} className="btn-primary w-full justify-center disabled:opacity-50">
            {busy ? "Submitting…" : "Submit scorecard"}
          </button>
        </form>
      ) : (
        <section className="card p-6">
          <h2 className="text-lg font-semibold">Scorecard access</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Only the interviewer assigned to this interview can submit a scorecard. If you believe
            this is an error, ask a recruiter to reassign the interview.
          </p>
        </section>
      )}
    </div>
  );
}
