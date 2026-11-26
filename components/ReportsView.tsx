"use client";

import { useEffect, useState } from "react";
import { StageBadge } from "@/components/Badges";
import { Chart, Clock, Trend, Users } from "@/components/Icons";
import { titleCase } from "@/lib/format";
import type { Stage } from "@/lib/types";

type FunnelRow = { stage: Stage; count: number };
type TimeRow = { department: string; jobTitle: string; hires: number; avgDays: number };
type SourceRow = { source: string; total: number; interviews: number; hires: number; hireRate: number };

export function ReportsView({
  jobs,
  selectedJob,
  initialFunnel,
  initialTime,
  initialSources,
}: {
  jobs: Array<{ id: string; title: string }>;
  selectedJob: string;
  initialFunnel: FunnelRow[];
  initialTime: { overallAvgDays: number; totalHires: number; byJob: TimeRow[] };
  initialSources: SourceRow[];
}) {
  const [job, setJob] = useState(selectedJob);
  const [funnel, setFunnel] = useState(initialFunnel);
  const [time, setTime] = useState(initialTime);
  const [sources, setSources] = useState(initialSources);
  const [error, setError] = useState("");

  useEffect(() => {
    if (job === selectedJob) return;
    let cancelled = false;
    async function load() {
      setError("");
      try {
        const query = job ? `?job=${job}` : "";
        const [f, t, s] = await Promise.all([
          fetch(`/api/reports/funnel${query}`),
          fetch(`/api/reports/time-to-hire${query}`),
          fetch(`/api/reports/sources${query}`),
        ]);
        if (!f.ok || !t.ok || !s.ok) throw new Error("Report request failed");
        const [fd, td, sd] = await Promise.all([f.json(), t.json(), s.json()]);
        if (cancelled) return;
        setFunnel(fd.funnel);
        setTime(td);
        setSources(sd.sources);
      } catch {
        if (!cancelled) setError("Could not load reports for that role.");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [job, selectedJob]);

  const total = funnel.reduce((sum, row) => sum + row.count, 0);
  const maxStage = Math.max(...funnel.map((row) => row.count), 1);
  const maxSource = Math.max(...sources.map((row) => row.total), 1);
  const topSource = sources.reduce<SourceRow | null>(
    (best, row) => (!best || row.total > best.total ? row : best),
    null,
  );

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
            Insights
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            Funnel health, hiring speed and where candidates come from.
          </p>
        </div>
        <div>
          <label htmlFor="report-job" className="mb-1.5 block text-xs font-medium text-muted">
            Filter by role
          </label>
          <select id="report-job" value={job} onChange={(event) => setJob(event.target.value)} className="input w-64">
            <option value="">All roles</option>
            {jobs.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg bg-[#fbedeb] px-3 py-2.5 text-sm text-danger">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Report summary">
        <Stat label="Applications" value={String(total)} Icon={Users} />
        <Stat label="Hires" value={String(time.totalHires)} Icon={Trend} />
        <Stat label="Avg. time to hire" value={`${time.overallAvgDays} days`} Icon={Clock} />
        <Stat label="Top source" value={topSource ? titleCase(topSource.source) : "—"} Icon={Chart} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-lg font-semibold">Funnel by stage</h2>
          <p className="mt-1 text-sm text-muted">Counts include every application at its current stage.</p>
          <div className="mt-6 space-y-4">
            {funnel.map((row) => (
              <div key={row.stage}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <StageBadge stage={row.stage} />
                  <span className="num font-semibold">{row.count}</span>
                </div>
                <div className="h-2 rounded-full bg-paper">
                  <div className="h-2 rounded-full bg-forest" style={{ width: `${(row.count / maxStage) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold">Time to hire</h2>
          <p className="mt-1 text-sm text-muted">
            Days from application to hire, based on recorded stage history.
          </p>
          {time.byJob.length === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
              No hires recorded for this selection yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="py-2 font-semibold">Role</th>
                    <th scope="col" className="py-2 font-semibold">Team</th>
                    <th scope="col" className="num py-2 font-semibold">Hires</th>
                    <th scope="col" className="num py-2 font-semibold">Avg days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {time.byJob.map((row) => (
                    <tr key={`${row.department}-${row.jobTitle}`}>
                      <td className="py-2.5 pr-3">{row.jobTitle}</td>
                      <td className="py-2.5 pr-3 text-muted">{row.department}</td>
                      <td className="num py-2.5 pr-3">{row.hires}</td>
                      <td className="num py-2.5 font-semibold">{row.avgDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Source performance</h2>
        <p className="mt-1 text-sm text-muted">Volume and hire rate for each source. Zero-volume sources are hidden.</p>
        {sources.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            No applications recorded for this selection.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="py-2 font-semibold">Source</th>
                  <th scope="col" className="num py-2 font-semibold">Applications</th>
                  <th scope="col" className="num py-2 font-semibold">Reached interview</th>
                  <th scope="col" className="num py-2 font-semibold">Hires</th>
                  <th scope="col" className="py-2 font-semibold">Hire rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sources.map((row) => (
                  <tr key={row.source}>
                    <td className="py-3 pr-4 font-medium">{titleCase(row.source)}</td>
                    <td className="num py-3 pr-4">{row.total}</td>
                    <td className="num py-3 pr-4 text-muted">{row.interviews}</td>
                    <td className="num py-3 pr-4">{row.hires}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 rounded-full bg-paper">
                          <div className="h-2 rounded-full bg-clay" style={{ width: `${(row.total / maxSource) * 100}%` }} />
                        </div>
                        <span className="num text-xs font-semibold">{row.hireRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, Icon }: { label: string; value: string; Icon: typeof Users }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon width={18} height={18} className="text-forest" />
      </div>
      <p className="num mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
