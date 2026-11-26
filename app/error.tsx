"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fbedeb] text-danger">
          !
        </span>
        <h1 className="mt-5 text-xl font-semibold">Something interrupted that page</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          The request did not complete. Your data is safe — try again, and if it keeps happening,
          check that the database is running.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Go to overview
          </Link>
        </div>
      </div>
    </main>
  );
}
