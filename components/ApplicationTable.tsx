"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StageBadge } from "@/components/Badges";
import { Search, Users } from "@/components/Icons";
import { SOURCES, STAGES } from "@/lib/constants";
import { formatRelative, titleCase } from "@/lib/format";
import type { ApplicationListItem, Paginated } from "@/lib/types";

type Params = {
  q: string;
  stage: string;
  job: string;
  source: string;
  sort: string;
  page: number;
};

export function ApplicationTable({
  data,
  params,
  jobs,
}: {
  data: Paginated<ApplicationListItem>;
  params: Params;
  jobs: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [q, setQ] = useState(params.q);

  function navigate(overrides: Partial<Params>) {
    const next = { ...params, ...overrides };
    const search = new URLSearchParams();
    if (next.q) search.set("q", next.q);
    if (next.stage) search.set("stage", next.stage);
    if (next.job) search.set("job", next.job);
    if (next.source) search.set("source", next.source);
    if (next.sort && next.sort !== "newest") search.set("sort", next.sort);
    if (next.page > 1) search.set("page", String(next.page));
    router.push(`/applications${search.toString() ? `?${search}` : ""}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
        <p className="mt-1 text-sm text-muted">
          {data.total} {data.total === 1 ? "application" : "applications"} in your pipeline.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q, page: 1 });
        }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <label htmlFor="candidate-search" className="sr-only">Search candidates</label>
          <input id="candidate-search" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name or email" className="input pl-10" />
        </div>
        <label className="sr-only" htmlFor="stage-filter">Filter by stage</label>
        <select id="stage-filter" value={params.stage} onChange={(event) => navigate({ stage: event.target.value, page: 1 })} className="input">
          <option value="">All stages</option>
          {STAGES.map((stage) => <option key={stage} value={stage}>{titleCase(stage)}</option>)}
        </select>
        <label className="sr-only" htmlFor="job-filter">Filter by job</label>
        <select id="job-filter" value={params.job} onChange={(event) => navigate({ job: event.target.value, page: 1 })} className="input">
          <option value="">All jobs</option>
          {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
        </select>
        <div className="flex gap-3">
          <label className="sr-only" htmlFor="source-filter">Filter by source</label>
          <select id="source-filter" value={params.source} onChange={(event) => navigate({ source: event.target.value, page: 1 })} className="input min-w-0 flex-1">
            <option value="">All sources</option>
            {SOURCES.map((source) => <option key={source} value={source}>{titleCase(source)}</option>)}
          </select>
          <button type="submit" className="btn-secondary">Go</button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <p><span className="num font-semibold text-ink">{data.total}</span> results</p>
        <label className="flex items-center gap-2">
          Sort
          <select
            value={params.sort || "newest"}
            onChange={(event) => navigate({ sort: event.target.value, page: 1 })}
            className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      {data.items.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest"><Users /></span>
          <h2 className="mt-4 text-lg font-semibold">No candidates match</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Adjust a filter or clear the search to see the full pipeline.
          </p>
          <button type="button" onClick={() => { setQ(""); navigate({ q: "", stage: "", job: "", source: "", sort: "newest", page: 1 }); }} className="btn-secondary mt-5">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Candidate</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold">Stage</th>
                <th scope="col" className="px-4 py-3 font-semibold">Source</th>
                <th scope="col" className="px-4 py-3 font-semibold">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((item) => (
                <tr key={item.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3">
                    <Link href={`/applications/${item.id}`} className="font-medium text-ink hover:text-forest hover:underline">
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted">{item.email}</p>
                    {item.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.tags.map((tag) => <span key={tag} className="chip">{tag}</span>)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{item.jobTitle}</td>
                  <td className="px-4 py-3"><StageBadge stage={item.stage} /></td>
                  <td className="px-4 py-3 text-muted">{titleCase(item.source)}</td>
                  <td className="num px-4 py-3 text-muted">{formatRelative(item.appliedAt)}</td>
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
