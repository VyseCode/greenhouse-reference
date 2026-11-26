"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Briefcase, Search } from "@/components/Icons";
import { titleCase } from "@/lib/format";
import type { JobDTO, Paginated } from "@/lib/types";

type Params = { q: string; department: string; sort: string; page: number };

export function JobBoard({
  data,
  departments,
  params,
}: {
  data: Paginated<JobDTO>;
  departments: string[];
  params: Params;
}) {
  const router = useRouter();
  const [q, setQ] = useState(params.q);

  function navigate(overrides: Partial<Params>) {
    const next = { ...params, ...overrides };
    const search = new URLSearchParams();
    if (next.q) search.set("q", next.q);
    if (next.department) search.set("department", next.department);
    if (next.sort && next.sort !== "newest") search.set("sort", next.sort);
    if (next.page > 1) search.set("page", String(next.page));
    router.push(`/jobs${search.toString() ? `?${search}` : ""}`);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q, page: 1 });
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search
            width={18}
            height={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <label htmlFor="job-search" className="sr-only">
            Search roles
          </label>
          <input
            id="job-search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search by title, team or location"
            className="input pl-10"
          />
        </div>
        <label htmlFor="department" className="sr-only">
          Filter by department
        </label>
        <select
          id="department"
          value={params.department}
          onChange={(event) => navigate({ department: event.target.value, page: 1 })}
          className="input sm:w-56"
        >
          <option value="">All teams</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
        <label htmlFor="sort" className="sr-only">
          Sort order
        </label>
        <select
          id="sort"
          value={params.sort || "newest"}
          onChange={(event) => navigate({ sort: event.target.value, page: 1 })}
          className="input sm:w-44"
        >
          <option value="newest">Newest first</option>
          <option value="title">Title A–Z</option>
        </select>
        <button type="submit" className="btn-primary justify-center">
          Search
        </button>
      </form>

      <div className="flex items-center justify-between text-sm text-muted">
        <p>
          <span className="num font-semibold text-ink">{data.total}</span> open
          {data.total === 1 ? " role" : " roles"}
        </p>
        {data.pages > 1 && (
          <p className="num">
            Page {data.page} of {data.pages}
          </p>
        )}
      </div>

      {data.items.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest">
            <Briefcase />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No roles match that search</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Try a different team or a broader term. We publish new roles as the teams grow.
          </p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              navigate({ q: "", department: "", sort: "newest", page: 1 });
            }}
            className="btn-secondary mt-5"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.items.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className="card group block h-full p-5 transition-colors hover:border-forest"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-forest">
                      {job.department}
                    </p>
                    <h3 className="mt-1.5 text-lg font-semibold tracking-tight group-hover:text-forest-deep">
                      {job.title}
                    </h3>
                  </div>
                  <ArrowRight
                    width={19}
                    height={19}
                    className="mt-1 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-forest"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="chip">{job.location}</span>
                  <span className="chip">{titleCase(job.employmentType)}</span>
                  {job.applicantsCount > 0 && (
                    <span className="chip num">{job.applicantsCount} applicants</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data.pages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          <button
            type="button"
            disabled={data.page <= 1}
            onClick={() => navigate({ page: data.page - 1 })}
            className="btn-secondary disabled:opacity-40"
          >
            Previous
          </button>
          <span className="num px-3 text-sm text-muted">
            {data.page} / {data.pages}
          </span>
          <button
            type="button"
            disabled={data.page >= data.pages}
            onClick={() => navigate({ page: data.page + 1 })}
            className="btn-secondary disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
