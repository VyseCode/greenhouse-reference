import Link from "next/link";
import { Leaf } from "@/components/Icons";
import { getCurrentUser } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/jobs" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-forest text-white">
              <Leaf width={19} height={19} />
            </span>
            Rowan
          </Link>
          <nav className="flex items-center gap-3 text-sm" aria-label="Public navigation">
            <Link href="/jobs" className="rounded-lg px-3 py-2 text-muted hover:text-ink">
              Open roles
            </Link>
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                Workspace
              </Link>
            ) : (
              <Link href="/login" className="btn-secondary">
                Staff sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Rowan — a reference implementation inspired by Greenhouse.</p>
          <p>Built for clear, considered hiring.</p>
        </div>
      </footer>
    </div>
  );
}
