"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Briefcase, Plus, Search } from "@/components/Icons";
import { titleCase } from "@/lib/format";
import type { JobDTO, Paginated } from "@/lib/types";

type Params = { q: string; status: string; page: number };
type DraftQuestion = { prompt: string; required: boolean };

export function JobManager({
  data,
  params,
  canDelete,
}: {
  data: Paginated<JobDTO>;
  params: Params;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(params.q);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  function navigate(overrides: Partial<Params>) {
    const next = { ...params, ...overrides };
    const search = new URLSearchParams();
    if (next.q) search.set("q", next.q);
    if (next.status) search.set("status", next.status);
    if (next.page > 1) search.set("page", String(next.page));
    router.push(`/jobs/manage${search.toString() ? `?${search}` : ""}`);
  }

  async function createJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          department: String(form.get("department") ?? ""),
          location: String(form.get("location") ?? ""),
          employmentType: String(form.get("employmentType") ?? "full-time"),
          status: String(form.get("status") ?? "draft"),
          description: String(form.get("description") ?? ""),
          questions: questions.filter((question) => question.prompt.trim()).map((question) => ({
            prompt: question.prompt.trim(),
            required: question.required,
            type: "text",
          })),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not create the job");
        return;
      }
      setCreating(false);
      setQuestions([]);
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(job: JobDTO, status: string) {
    setError("");
    const response = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Could not update the job");
    }
    router.refresh();
  }

  async function remove(job: JobDTO) {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    const response = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Could not delete the job");
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted">
            {data.total} {data.total === 1 ? "job" : "jobs"} across all teams and statuses.
          </p>
        </div>
        <button type="button" onClick={() => setCreating((v) => !v)} className="btn-primary">
          {creating ? "Close" : <><Plus width={17} height={17} /> New job</>}
        </button>
      </div>

      {creating && (
        <form onSubmit={createJob} className="card space-y-4 p-5">
          <h2 className="font-semibold">Create a job</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" name="title" required placeholder="Senior Backend Engineer" />
            <Field label="Department" name="department" required placeholder="Engineering" />
            <Field label="Location" name="location" required placeholder="Berlin, Germany" />
            <div>
              <label htmlFor="employmentType" className="mb-1.5 block text-sm font-medium">
                Employment type
              </label>
              <select id="employmentType" name="employmentType" className="input">
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
              Description
            </label>
            <textarea id="description" name="description" rows={5} required minLength={40} className="input resize-y" placeholder="What will this person do, and why does the role matter?" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Application questions</p>
              <button
                type="button"
                onClick={() => setQuestions((prev) => [...prev, { prompt: "", required: false }])}
                className="text-sm font-semibold text-forest hover:underline"
              >
                + Add question
              </button>
            </div>
            {questions.map((question, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={question.prompt}
                  onChange={(event) =>
                    setQuestions((prev) =>
                      prev.map((q, i) => (i === index ? { ...q, prompt: event.target.value } : q)),
                    )
                  }
                  placeholder="e.g. Why are you interested in this role?"
                  className="input"
                />
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(event) =>
                      setQuestions((prev) =>
                        prev.map((q, i) => (i === index ? { ...q, required: event.target.checked } : q)),
                      )
                    }
                  />
                  Required
                </label>
                <button
                  type="button"
                  aria-label={`Remove question ${index + 1}`}
                  onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                  className="rounded p-1 text-muted hover:text-danger"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="status" className="text-sm font-medium">
              Save as
            </label>
            <select id="status" name="status" className="input w-40" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="open">Open</option>
            </select>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Saving…" : "Create job"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-[#fbedeb] px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q, page: 1 });
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <label htmlFor="job-filter" className="sr-only">Search jobs</label>
          <input id="job-filter" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search jobs" className="input pl-10" />
        </div>
        <label htmlFor="status-filter" className="sr-only">Filter by status</label>
        <select
          id="status-filter"
          value={params.status}
          onChange={(event) => navigate({ status: event.target.value, page: 1 })}
          className="input sm:w-44"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <button type="submit" className="btn-secondary">Apply</button>
      </form>

      {data.items.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest">
            <Briefcase />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No jobs here yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Create a role to start collecting applications, or clear the filters to see everything.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold">Team</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold num">Applicants</th>
                <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((job) => (
                <tr key={job.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-xs text-muted">{job.location} · {titleCase(job.employmentType)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{job.department}</td>
                  <td className="px-4 py-3">
                    <label className="sr-only" htmlFor={`status-${job.id}`}>Status for {job.title}</label>
                    <select
                      id={`status-${job.id}`}
                      value={job.status}
                      onChange={(event) => changeStatus(job, event.target.value)}
                      className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
                    >
                      <option value="draft">Draft</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="num px-4 py-3 text-muted">{job.applicantsCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link href={`/jobs/${job.id}`} className="text-forest hover:underline">View</Link>
                      <Link href={`/jobs/${job.id}/edit`} className="text-forest hover:underline">Edit</Link>
                      {canDelete && (
                        <button type="button" onClick={() => remove(job)} className="text-danger hover:underline">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.pages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          <button type="button" disabled={data.page <= 1} onClick={() => navigate({ page: data.page - 1 })} className="btn-secondary disabled:opacity-40">Previous</button>
          <span className="num px-3 text-sm text-muted">{data.page} / {data.pages}</span>
          <button type="button" disabled={data.page >= data.pages} onClick={() => navigate({ page: data.page + 1 })} className="btn-secondary disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">{label}</label>
      <input id={name} name={name} required={required} placeholder={placeholder} className="input" />
    </div>
  );
}
