"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Close, Plus, Tag } from "@/components/Icons";
import { REJECTION_REASONS, STAGES, STAGE_ORDER } from "@/lib/constants";
import type { ApplicationDetail, Stage } from "@/lib/types";

export function CandidateWorkflow({
  application,
  canManage,
}: {
  application: ApplicationDetail;
  canManage: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(application.stage);
  const [reason, setReason] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

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

      {error && <p role="alert" className="rounded-lg bg-[#fbedeb] px-3 py-2 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-sage px-3 py-2 text-sm text-forest-deep">{notice}</p>}
    </section>
  );
}
