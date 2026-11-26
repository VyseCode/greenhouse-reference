"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Board,
  Briefcase,
  Calendar,
  Chart,
  Close,
  Leaf,
  LogOut,
  Menu,
  Users,
} from "@/components/Icons";
import type { Role } from "@/lib/constants";

type NavUser = { name: string; email: string; role: Role };

const staffLinks = [
  { href: "/dashboard", label: "Overview", Icon: Chart },
  { href: "/jobs/manage", label: "Jobs", Icon: Briefcase },
  { href: "/applications", label: "Candidates", Icon: Users },
  { href: "/board", label: "Pipeline", Icon: Board },
  { href: "/offers", label: "Offers", Icon: Leaf },
  { href: "/reports", label: "Reports", Icon: Chart },
];

const memberLinks = [{ href: "/interviews", label: "Interviews", Icon: Calendar }];

export function WorkspaceNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isStaff = user.role === "recruiter" || user.role === "admin";
  const links = [...staffLinks.filter(() => isStaff), ...memberLinks];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-forest text-white">
            <Leaf width={18} height={18} />
          </span>
          Rowan
        </Link>
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink"
        >
          <Menu />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/30"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute right-0 top-0 h-full w-[260px] bg-surface p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-paper"
              >
                <Close />
              </button>
            </div>
            <NavLinks links={links} pathname={pathname} onNavigate={() => setOpen(false)} />
            <LogoutButton onClick={logout} />
          </nav>
        </div>
      )}

      <aside className="hidden w-[232px] shrink-0 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2.5 px-2 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-forest text-white">
            <Leaf width={19} height={19} />
          </span>
          Rowan
        </Link>
        <NavLinks links={links} pathname={pathname} />
        <div className="mt-auto border-t border-line px-2 pt-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-forest">{user.role}</p>
          <LogoutButton onClick={logout} />
        </div>
      </aside>
    </>
  );
}

function NavLinks({
  links,
  pathname,
  onNavigate,
}: {
  links: Array<{ href: string; label: string; Icon: typeof Chart }>;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1" aria-label="Main navigation">
      {links.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-sage font-semibold text-forest-deep"
                : "text-muted hover:bg-paper hover:text-ink"
            }`}
          >
            <Icon width={18} height={18} />
            {label}
          </Link>
        );
      })}
      <div className="pt-3">
        <Link
          href="/jobs"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-paper hover:text-ink"
        >
          <Briefcase width={18} height={18} />
          Public job board
        </Link>
      </div>
    </nav>
  );
}

function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted hover:bg-paper hover:text-ink"
    >
      <LogOut width={17} height={17} />
      Sign out
    </button>
  );
}
