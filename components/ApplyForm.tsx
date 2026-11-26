"use client";

import { useState } from "react";
import { Check, FileText } from "@/components/Icons";
import type { QuestionDTO } from "@/lib/types";

export function ApplyForm({
  jobId,
  questions,
}: {
  jobId: string;
  questions: QuestionDTO[];
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const answers = questions.map((question) => ({
      question: question.prompt,
      answer: String(form.get(`answer-${question.id}`) ?? "").trim(),
    }));

    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          resumeUrl: String(form.get("resumeUrl") ?? ""),
          source: String(form.get("source") ?? "careers-page"),
          answers,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        application?: { id: string; name: string };
      };
      if (!response.ok || !data.application) {
        setError(data.error ?? "We could not submit your application");
        return;
      }
      setSubmitted(data.application.id);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="card p-7" role="status">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-forest">
          <Check />
        </span>
        <h2 className="mt-4 text-xl font-semibold">Application received</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Thank you — your application is now with the hiring team. We read every one and will be in
          touch about the next step.
        </p>
        <p className="num mt-4 text-xs text-muted">Reference: {submitted.slice(-8)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6 sm:p-7">
      <div>
        <h2 className="text-lg font-semibold">Apply for this role</h2>
        <p className="mt-1 text-sm text-muted">
          A few details and a link to your resume. No account needed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            Full name
          </label>
          <input id="name" name="name" required minLength={2} className="input" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="input"
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label htmlFor="resumeUrl" className="mb-1.5 block text-sm font-medium">
          Resume URL
        </label>
        <div className="relative">
          <FileText
            width={17}
            height={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="resumeUrl"
            name="resumeUrl"
            type="url"
            required
            placeholder="https://…/your-resume.pdf"
            className="input pl-10"
          />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Link to a PDF or portfolio page. We do not store the file ourselves.
        </p>
      </div>

      <div>
        <label htmlFor="source" className="mb-1.5 block text-sm font-medium">
          How did you hear about us?
        </label>
        <select id="source" name="source" className="input" defaultValue="careers-page">
          <option value="careers-page">This job board</option>
          <option value="referral">A referral</option>
          <option value="linkedin">LinkedIn</option>
          <option value="job-board">Another job board</option>
          <option value="outbound">Someone reached out to me</option>
        </select>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4 border-t border-line pt-5">
          <p className="text-sm font-semibold">A few questions</p>
          {questions.map((question) => (
            <div key={question.id}>
              <label htmlFor={`answer-${question.id}`} className="mb-1.5 block text-sm font-medium">
                {question.prompt}
                {question.required && <span className="ml-1 text-clay">*</span>}
              </label>
              {question.type === "textarea" ? (
                <textarea
                  id={`answer-${question.id}`}
                  name={`answer-${question.id}`}
                  required={question.required}
                  rows={3}
                  className="input resize-y"
                />
              ) : (
                <input
                  id={`answer-${question.id}`}
                  name={`answer-${question.id}`}
                  type={question.type === "url" ? "url" : "text"}
                  required={question.required}
                  className="input"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-[#fbedeb] px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}
