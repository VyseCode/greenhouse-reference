"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash } from "@/components/Icons";
import type { JobDTO } from "@/lib/types";

type EditableQuestion = {
  key: string;
  prompt: string;
  required: boolean;
  type: "text" | "textarea" | "url";
};

export function JobEditor({ job }: { job: JobDTO }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    job.questions.map((q) => ({ key: q.id, prompt: q.prompt, required: q.required, type: q.type })),
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          department: String(form.get("department") ?? ""),
          location: String(form.get("location") ?? ""),
          employmentType: String(form.get("employmentType") ?? "full-time"),
          status: String(form.get("status") ?? "draft"),
          description: String(form.get("description") ?? ""),
          questions: questions.map(({ prompt, required, type }) => ({ prompt, required, type })),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not save changes");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function update(index: number, patch: Partial<EditableQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/jobs/manage" className="text-sm text-muted hover:text-forest">
            ← All jobs
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit {job.title}</h1>
        </div>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-[#fbedeb] px-3 py-2.5 text-sm text-danger">{error}</p>}
      {saved && <p role="status" className="rounded-lg bg-sage px-3 py-2.5 text-sm text-forest-deep">Changes saved.</p>}

      <div className="card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">Job title</label>
            <input id="title" name="title" required minLength={3} defaultValue={job.title} className="input" />
          </div>
          <div>
            <label htmlFor="department" className="mb-1.5 block text-sm font-medium">Department</label>
            <input id="department" name="department" required defaultValue={job.department} className="input" />
          </div>
          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-medium">Location</label>
            <input id="location" name="location" required defaultValue={job.location} className="input" />
          </div>
          <div>
            <label htmlFor="employmentType" className="mb-1.5 block text-sm font-medium">Employment type</label>
            <select id="employmentType" name="employmentType" className="input" defaultValue={job.employmentType}>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium">Status</label>
          <select id="status" name="status" className="input" defaultValue={job.status}>
            <option value="draft">Draft — hidden from the public board</option>
            <option value="open">Open — accepting applications</option>
            <option value="closed">Closed — no longer accepting applications</option>
          </select>
        </div>
        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea id="description" name="description" rows={14} minLength={40} defaultValue={job.description} className="input resize-y" />
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Application questions</h2>
            <p className="mt-1 text-xs text-muted">Applicants answer these on the public form. Up to 10.</p>
          </div>
          <button
            type="button"
            disabled={questions.length >= 10}
            onClick={() =>
              setQuestions((prev) => [
                ...prev,
                { key: `new-${Date.now()}`, prompt: "", required: false, type: "text" },
              ])
            }
            className="btn-secondary disabled:opacity-40"
          >
            <Plus width={16} height={16} /> Add
          </button>
        </div>
        {questions.length === 0 && (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            No questions yet. Applicants will only need a name, email and resume link.
          </p>
        )}
        {questions.map((question, index) => (
          <div key={question.key} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_auto_auto_auto]">
            <input
              aria-label={`Question ${index + 1}`}
              value={question.prompt}
              onChange={(event) => update(index, { prompt: event.target.value })}
              placeholder="Enter a question"
              className="input"
            />
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input type="checkbox" checked={question.required} onChange={(event) => update(index, { required: event.target.checked })} />
              Required
            </label>
            <label className="sr-only" htmlFor={`qtype-${index}`}>Question type</label>
            <select
              id={`qtype-${index}`}
              value={question.type}
              onChange={(event) => update(index, { type: event.target.value as EditableQuestion["type"] })}
              className="input w-28"
            >
              <option value="text">Text</option>
              <option value="textarea">Long text</option>
              <option value="url">URL</option>
            </select>
            <button
              type="button"
              aria-label={`Remove question ${index + 1}`}
              onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
              className="flex items-center justify-center rounded-lg px-2 text-muted hover:text-danger"
            >
              <Trash width={17} height={17} />
            </button>
          </div>
        ))}
      </div>
    </form>
  );
}
