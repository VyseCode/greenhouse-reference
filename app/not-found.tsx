import Link from "next/link";
import { Leaf } from "@/components/Icons";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest">
          <Leaf />
        </span>
        <p className="num mt-5 text-xs font-semibold uppercase tracking-widest text-forest">404</p>
        <h1 className="mt-2 text-xl font-semibold">We could not find that page</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          The link may be out of date, or the role may have been closed and removed.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/jobs" className="btn-primary">
            Browse open roles
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
