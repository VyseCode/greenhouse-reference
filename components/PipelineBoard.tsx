"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StageBadge } from "@/components/Badges";
import { Close } from "@/components/Icons";
import { REJECTION_REASONS, STAGES, STAGE_ORDER } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import type { ApplicationListItem, Stage } from "@/lib/types";

type Column = { stage: Stage; items: ApplicationListItem[]; total: number };
type MoveState = { application: ApplicationListItem; target: Stage } | null;

export function PipelineBoard({ columns }: { columns: Column[] }) {
  const router = useRouter();
  const [move, setMove] = useState<MoveState>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function openMove(application: ApplicationListItem, target: Stage) {
    setMove({ application, target });
    setReason("");
    setError("");
  }

  async function confirmMove() {
    if (!move) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/applications/${move.application.id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: move.target, reason }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not move the candidate");
        return;
      }
      setMove(null);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const needsReason =
    move !== null &&
    (move.target === "rejected" ||
      STAGE_ORDER[move.target] < STAGE_ORDER[move.application.stage]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline board</h1>
        <p className="mt-1 text-sm text-muted">
          Move candidates between stages. Each move is recorded in the activity trail.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        <div className="flex min-w-[1100px] gap-4">
          {columns.map((column) => (
            <section key={column.stage} className="w-[210px] shrink-0">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StageBadge stage={column.stage} />
                  <span className="num text-xs text-muted">{column.total}</span>
                </div>
              </div>
              <div className="space-y-2 rounded-xl bg-sand/50 p-2">
                {column.items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-3 py-8 text-center text-xs text-muted">
                    No candidates here
                  </p>
                ) : (
                  column.items.map((item) => (
                    <article key={item.id} className="rounded-lg border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(29,43,37,0.04)]">
                      <a href={`/applications/${item.id}`} className="block text-sm font-semibold hover:text-forest hover:underline">
                        {item.name}
                      </a>
                      <p className="mt-0.5 truncate text-xs text-muted">{item.jobTitle}</p>
                      <p className="num mt-1 text-[11px] text-muted">{formatRelative(item.appliedAt)}</p>
                      {item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.tags.slice(0, 2).map((tag) => <span key={tag} className="chip !px-2 !py-0.5 !text-[10px]">{tag}</span>)}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {STAGES.filter((stage) => stage !== column.stage).slice(0, 4).map((stage) => (
                          <button
                            key={stage}
                            type="button"
                            onClick={() => openMove(item, stage)}
                            className="rounded border border-line px-1.5 py-0.5 text-[10px] font-medium text-muted hover:border-forest hover:text-forest"
                          >
                            → {stage}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))
                )}
                {column.total > column.items.length && (
                  <p className="px-2 py-2 text-center text-[11px] text-muted">
                    Showing {column.items.length} of {column.total}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      {move && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-ink/40" onClick={() => setMove(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="move-title" className="card relative w-full max-w-md p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 id="move-title" className="text-lg font-semibold">Move {move.application.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  From <span className="font-medium">{move.application.stage}</span> to{" "}
                  <span className="font-medium">{move.target}</span>
                </p>
              </div>
              <button type="button" aria-label="Close dialog" onClick={() => setMove(null)} className="rounded p-1 text-muted hover:bg-paper">
                <Close width={18} height={18} />
              </button>
            </div>

            {needsReason && (
              <div className="mt-5">
                <label htmlFor="move-reason" className="mb-1.5 block text-sm font-medium">
                  {move.target === "rejected" ? "Rejection reason" : "Reason for moving backwards"}
                </label>
                {move.target === "rejected" ? (
                  <select id="move-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="input">
                    <option value="">Choose a reason</option>
                    {REJECTION_REASONS.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                ) : (
                  <textarea id="move-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className="input resize-y" placeholder="Why is this candidate moving back?" />
                )}
              </div>
            )}

            {error && <p role="alert" className="mt-4 rounded-lg bg-[#fbedeb] px-3 py-2 text-sm text-danger">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setMove(null)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={confirmMove} disabled={busy || (needsReason && !reason)} className="btn-primary disabled:opacity-50">
                {busy ? "Moving…" : "Confirm move"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
