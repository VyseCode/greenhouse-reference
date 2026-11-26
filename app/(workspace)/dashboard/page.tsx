import type { Metadata } from "next";
import Link from "next/link";
import { StageBadge } from "@/components/Badges";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Chart,
  Leaf,
  Users,
} from "@/components/Icons";
import { connectDB } from "@/lib/db";
import { formatRelative, titleCase } from "@/lib/format";
import { requirePageStaff } from "@/lib/page-auth";
import { getDashboardStats, getFunnel } from "@/lib/queries";

export const metadata: Metadata = { title: "Overview — Rowan" };

export default async function DashboardPage() {
  const user = await requirePageStaff();
  await connectDB();
  const [stats, funnel] = await Promise.all([getDashboardStats(), getFunnel()]);
  const maxStage = Math.max(...funnel.map((row) => row.count), 1);

  const cards = [
    { label: "Open roles", value: stats.openJobs, Icon: Briefcase, href: "/jobs/manage" },
    { label: "Active candidates", value: stats.activeCandidates, Icon: Users, href: "/applications" },
    { label: "Upcoming interviews", value: stats.upcomingInterviews, Icon: Calendar, href: "/interviews" },
    { label: "Pending offers", value: stats.pendingOffers, Icon: Leaf, href: "/offers" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
            Workspace overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Good to see you, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here is where your hiring stands today.
          </p>
        </div>
        <Link href="/reports" className="btn-secondary">
          <Chart width={17} height={17} /> Full reports
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key metrics">
        {cards.map(({ label, value, Icon, href }) => (
          <Link key={label} href={href} className="card group p-5 transition-colors hover:border-forest">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{label}</span>
              <Icon width={18} height={18} className="text-forest" />
            </div>
            <p className="num mt-3 text-3xl font-semibold tracking-tight">{value}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-forest opacity-0 transition-opacity group-hover:opacity-100">
              View <ArrowRight width={13} height={13} />
            </span>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current funnel</h2>
            <Link href="/reports" className="text-sm font-semibold text-forest hover:underline">
              Details
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted">Every application, grouped by stage.</p>
          <div className="mt-6 space-y-4">
            {funnel.map((row) => (
              <div key={row.stage}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{titleCase(row.stage)}</span>
                  <span className="num text-muted">{row.count}</span>
                </div>
                <div className="h-2 rounded-full bg-paper">
                  <div
                    className="h-2 rounded-full bg-forest"
                    style={{ width: `${Math.max((row.count / maxStage) * 100, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold">Latest applications</h2>
          <p className="mt-1 text-sm text-muted">The newest candidates in your pipeline.</p>
          <ul className="mt-5 space-y-4">
            {stats.recent.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/applications/${item.id}`} className="block truncate text-sm font-medium hover:text-forest hover:underline">
                    {item.name}
                  </Link>
                  <p className="truncate text-xs text-muted">{item.jobTitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  <StageBadge stage={item.stage} />
                  <p className="num mt-1 text-[11px] text-muted">{formatRelative(item.appliedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/applications" className="btn-secondary mt-6 w-full justify-center">
            All candidates <ArrowRight width={16} height={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
