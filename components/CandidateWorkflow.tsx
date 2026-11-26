"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Calendar, Close, Plus, Tag } from "@/components/Icons";
import { REJECTION_REASONS, STAGES, STAGE_ORDER } from "@/lib/constants";
import type { ApplicationDetail, Stage, UserDTO } from "@/lib/types";

export function CandidateWorkflow({
  application,
  interviewers,
  canManage,
}: {
  application: ApplicationDetail;
  interviewers: UserDTO[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(application.stage);
  const [reason, setReason] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showInterview, setShowInterview] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [interviewerId, setInterviewerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [interviewNote, setInterviewNote] = useState("");
  const [salary, setSalary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [offerNote, setOfferNote] = useState("");

  const needsReason =
    stage === "rejected" || STAGE_ORDER[stage] < STAGE_ORDER[application.stage];

  async function moveStage() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch(`/api/applications/${application.id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, reason }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not move the candidate");
        return;
      }
      setNotice(`Moved to ${stage}.`);
      setReason("");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function changeTag(action: "add" | "remove", value: string) {
    setError("");
    const response = await fetch(`/api/applications/${application.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: value, action }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not update tags");
      return;
    }
    if (action === "add") setTag("");
    router.refresh();
  }

  async function scheduleInterview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch(`/api/applications/${application.id}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewerId,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes,
          note: interviewNote,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not schedule the interview");
        return;
      }
      setNotice("Interview scheduled.");
      setShowInterview(false);
      setInterviewNote("");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function createOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch(`/api/applications/${application.id}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary: Number(salary),
          startDate,
          note: offerNote,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not create the offer");
        return;
      }
      setNotice("Offer created as a draft.");
      setShowOffer(false);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!canManage) {
    return (
      <section className="card p-5">
        <h2 className="mb-2 text-sm font-semibold">Workflow</h2>
        <p className="text-sm leading-6 text-muted">
          Interviewers can submit scorecards for their assigned interviews. Stage changes and tags
          are managed by recruiters and admins.
        </p>
      </section>
    );
  }

  return (
    <section className="card space-y-5 p-5">
      <div>
        <h2 className="text-sm font-semibold">Move stage</h2>
        <p className="mt-1 text-xs text-muted">Current stage: {application.stage}</p>
        <label htmlFor="workflow-stage" className="sr-only">Target stage</label>
        <select
          id="workflow-stage"
          value={stage}
          onChange={(event) => {
            setStage(event.target.value as Stage);
            setReason("");
          }}
          className="input mt-3"
        >
          {STAGES.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>

        {needsReason && (
          <div className="mt-3">
            <label htmlFor="workflow-reason" className="mb-1.5 block text-sm font-medium">
              {stage === "rejected" ? "Rejection reason" : "Reason for moving backwards"}
            </label>
            {stage === "rejected" ? (
              <select id="workflow-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="input">
                <option value="">Choose a reason</option>
                {REJECTION_REASONS.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            ) : (
              <textarea id="workflow-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className="input resize-y" placeholder="Explain the move" />
            )}
          </div>
        )}

        <button
          type="button"
          onClick={moveStage}
          disabled={busy || stage === application.stage || (needsReason && !reason)}
          className="btn-primary mt-3 w-full justify-center disabled:opacity-50"
        >
          {busy ? "Saving…" : "Update stage"}
        </button>
      </div>

      <div className="border-t border-line pt-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Tag width={16} height={16} className="text-forest" /> Tags
        </h2>
        <div className="mt-3 flex gap-2">
          <label htmlFor="new-tag" className="sr-only">New tag</label>
          <input
            id="new-tag"
            value={tag}
            onChange={(event) => setTag(event.target.value.toLowerCase())}
            placeholder="e.g. fast-track"
            className="input"
          />
          <button
            type="button"
            aria-label="Add tag"
            disabled={!tag}
            onClick={() => changeTag("add", tag)}
            className="btn-secondary shrink-0 disabled:opacity-40"
          >
            <Plus width={16} height={16} />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {application.tags.length === 0 ? (
            <p className="text-xs text-muted">No tags yet.</p>
          ) : (
            application.tags.map((value) => (
              <span key={value} className="chip">
                {value}
                <button
                  type="button"
                  aria-label={`Remove tag ${value}`}
                  onClick={() => changeTag("remove", value)}
                  className="text-muted hover:text-danger"
                >
                  <Close width={12} height={12} />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <button
          type="button"
          onClick={() => { setShowInterview((v) => !v); setShowOffer(false); }}
          className="flex w-full items-center justify-between text-sm font-semibold"
        >
          <span className="flex items-center gap-2"><Calendar width={16} height={16} className="text-forest" /> Schedule interview</span>
          <span className="text-muted">{showInterview ? "−" : "+"}</span>
        </button>
        {showInterview && (
          <form onSubmit={scheduleInterview} className="mt-3 space-y-3">
            <div>
              <label htmlFor="interviewer" className="mb-1.5 block text-xs font-medium">Interviewer</label>
              <select id="interviewer" required value={interviewerId} onChange={(event) => setInterviewerId(event.target.value)} className="input">
                <option value="">Choose an interviewer</option>
                {interviewers.map((person) => <option key={person.id} value={person.id}>{person.name} — {person.title}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="scheduled-at" className="mb-1.5 block text-xs font-medium">Date and time</label>
              <input id="scheduled-at" type="datetime-local" required value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="duration" className="mb-1.5 block text-xs font-medium">Duration (minutes)</label>
              <select id="duration" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="input">
                <option value={30}>30</option>
                <option value={45}>45</option>
                <option value={60}>60</option>
              </select>
            </div>
            <div>
              <label htmlFor="interview-note" className="mb-1.5 block text-xs font-medium">Agenda (optional)</label>
              <textarea id="interview-note" rows={2} value={interviewNote} onChange={(event) => setInterviewNote(event.target.value)} className="input resize-y" />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-50">
              {busy ? "Scheduling…" : "Schedule interview"}
            </button>
          </form>
        )}
      </div>

      <div className="border-t border-line pt-5">
        <button
          type="button"
          onClick={() => { setShowOffer((v) => !v); setShowInterview(false); }}
          className="flex w-full items-center justify-between text-sm font-semibold"
        >
          <span className="flex items-center gap-2"><ArrowRight width={16} height={16} className="text-forest" /> Create offer</span>
          <span className="text-muted">{showOffer ? "−" : "+"}</span>
        </button>
        {showOffer && (
          <form onSubmit={createOffer} className="mt-3 space-y-3">
            <div>
              <label htmlFor="salary" className="mb-1.5 block text-xs font-medium">Annual salary (USD)</label>
              <input id="salary" type="number" min={1} required value={salary} onChange={(event) => setSalary(event.target.value)} className="input num" placeholder="120000" />
            </div>
            <div>
              <label htmlFor="start-date" className="mb-1.5 block text-xs font-medium">Start date</label>
              <input id="start-date" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="offer-note" className="mb-1.5 block text-xs font-medium">Note (optional)</label>
              <textarea id="offer-note" rows={2} value={offerNote} onChange={(event) => setOfferNote(event.target.value)} className="input resize-y" />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-50">
              {busy ? "Creating…" : "Create draft offer"}
            </button>
          </form>
        )}
      </div>

      {error && <p role="alert" className="rounded-lg bg-[#fbedeb] px-3 py-2 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-sage px-3 py-2 text-sm text-forest-deep">{notice}</p>}
    </section>
  );
}
