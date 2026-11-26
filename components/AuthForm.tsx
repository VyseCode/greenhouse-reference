"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, Leaf } from "@/components/Icons";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body =
      mode === "register"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            role: String(form.get("role") ?? "recruiter"),
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen">
      <section className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[46%] lg:px-20">
        <div className="mx-auto w-full max-w-[380px]">
          <div className="mb-12 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-forest text-white">
              <Leaf width={20} height={20} />
            </span>
            <span className="text-lg font-semibold tracking-tight">Rowan</span>
          </div>

          <h1 className="text-[32px] font-semibold leading-tight tracking-tight">
            {isRegister ? "Set up your workspace" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {isRegister
              ? "A quieter place to run a thoughtful hiring process."
              : "Sign in to pick up where your hiring left off."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {isRegister && (
              <Field label="Full name" htmlFor="name">
                <input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  className="input"
                />
              </Field>
            )}

            <Field label="Work email" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="input"
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={isRegister ? 8 : 1}
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
                className="input"
              />
            </Field>

            {isRegister && (
              <Field label="I am joining as" htmlFor="role">
                <select id="role" name="role" className="input" defaultValue="recruiter">
                  <option value="recruiter">Recruiter — manage jobs and candidates</option>
                  <option value="interviewer">Interviewer — scorecard access only</option>
                </select>
              </Field>
            )}

            {error && (
              <p role="alert" className="rounded-lg bg-[#fbedeb] px-3 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
              {!loading && <ArrowRight width={17} height={17} />}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted">
            {isRegister ? "Already have an account? " : "Need an account? "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-forest underline underline-offset-4 hover:text-forest-deep"
            >
              {isRegister ? "Sign in" : "Create one"}
            </Link>
          </p>

          {!isRegister && (
            <div className="mt-8 rounded-xl border border-line bg-surface p-4 text-xs leading-5 text-muted">
              <p className="font-semibold text-ink">Demo accounts</p>
              <p className="num mt-1">dana@rowan.dev — admin</p>
              <p className="num">maya@rowan.dev — recruiter</p>
              <p className="num">iris@rowan.dev — interviewer</p>
              <p className="mt-1">All use the password password123</p>
            </div>
          )}
        </div>
      </section>

      <aside className="hidden flex-col justify-between bg-forest-deep px-14 py-16 text-white lg:flex lg:w-[54%]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Hiring, with context
          </p>
          <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[1.15] tracking-tight">
            Every candidate deserves a process that reads like a decision, not a spreadsheet.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
            Rowan keeps the job pipeline, interviews, weighted scorecards and offers in one place —
            with the reasoning behind every stage move attached to the record.
          </p>
        </div>
        <ul className="space-y-4">
          {[
            "Structured scorecards with weighted criteria",
            "A shared pipeline board with a full activity trail",
            "Funnel, time-to-hire and source reporting",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-white/85">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                <Check width={14} height={14} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
