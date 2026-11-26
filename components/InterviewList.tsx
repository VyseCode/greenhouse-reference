"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Check } from "@/components/Icons";
import { formatDateTime, titleCase } from "@/lib/format";
import type { InterviewDTO, Paginated } from "@/lib/types";

export function InterviewList({
  data,
  params,
}: {
  data: Paginated<InterviewDTO>;
  params: { status: string; page: number };
}) {
  const router = useRouter();

  function navigate(next: Partial<{ status: string; page: number }>) {
    const merged = { ...params, ...next };
    const search = new URLSearchParams();
    if (merged.status) search.set("status", merged.status);
    if (merged.page > 1) search.set("page", String(merged.page));
    router.push(`/interviews${search.toString() ? `?${search}` : ""}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Interviews</h1>
        <p className="mt-1 text-sm text-muted">
          {data.total} {data.total === 1 ? "interview" : "interviews"} — only your assigned interviews are shown to interviewers.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="interview-status" className="sr-only">Filter by status</label>
        <select id="interview-status" value={params.status} onChange={(event) => navigate({ status: event.target.value, page: 1 })} className="input w-48">
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {data.items.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest"><Calendar /></span>
          <h2 className="mt-4 text-lg font-semibold">No interviews here</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Interviews appear here once a recruiter schedules them with an interviewer.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Candidate</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold">Interviewer</th>
                <th scope="col" className="px-4 py-3 font-semibold">When</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((item) => (
                <tr key={item.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3">
                    <Link href={`/interviews/${item.id}`} className="font-medium hover:text-forest hover:underline">
                      {item.candidateName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{item.jobTitle}</td>
                  <td className="px-4 py-3 text-muted">{item.interviewerName}</td>
                  <td className="num px-4 py-3 text-muted">{formatDateTime(item.scheduledAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip">{titleCase(item.status)}</span>
                      {item.hasScorecard && (
                        <span className="flex items-center gap-1 text-xs font-medium text-forest">
                          <Check width={14} height={14} /> Scored
                        </span>
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
