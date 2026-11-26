"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OfferStatusBadge } from "@/components/Badges";
import { Leaf } from "@/components/Icons";
import { formatDate, formatMoney } from "@/lib/format";
import type { OfferDTO, Paginated } from "@/lib/types";

export function OfferList({
  data,
  params,
}: {
  data: Paginated<OfferDTO>;
  params: { status: string; page: number };
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  function navigate(next: Partial<{ status: string; page: number }>) {
    const merged = { ...params, ...next };
    const search = new URLSearchParams();
    if (merged.status) search.set("status", merged.status);
    if (merged.page > 1) search.set("page", String(merged.page));
    router.push(`/offers${search.toString() ? `?${search}` : ""}`);
  }

  async function setStatus(offer: OfferDTO, status: string) {
    setError("");
    const response = await fetch(`/api/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) setError(payload.error ?? "Could not update the offer");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Offers</h1>
        <p className="mt-1 text-sm text-muted">
          {data.total} {data.total === 1 ? "offer" : "offers"} across all roles. Accepted offers move the candidate to hired.
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-[#fbedeb] px-3 py-2.5 text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <label htmlFor="offer-status" className="sr-only">Filter by status</label>
        <select id="offer-status" value={params.status} onChange={(event) => navigate({ status: event.target.value, page: 1 })} className="input w-48">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      {data.items.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest"><Leaf /></span>
          <h2 className="mt-4 text-lg font-semibold">No offers yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Create an offer from a candidate profile when you are ready to move to the offer stage.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Candidate</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold num">Salary</th>
                <th scope="col" className="px-4 py-3 font-semibold">Start date</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((offer) => (
                <tr key={offer.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3">
                    <a href={`/applications/${offer.applicationId}`} className="font-medium hover:text-forest hover:underline">{offer.candidateName}</a>
                  </td>
                  <td className="px-4 py-3 text-muted">{offer.jobTitle}</td>
                  <td className="num px-4 py-3">{formatMoney(offer.salary)}</td>
                  <td className="num px-4 py-3 text-muted">{formatDate(offer.startDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <OfferStatusBadge status={offer.status} />
                      <label className="sr-only" htmlFor={`offer-${offer.id}`}>Update status for {offer.candidateName}</label>
                      <select
                        id={`offer-${offer.id}`}
                        value={offer.status}
                        onChange={(event) => setStatus(offer, event.target.value)}
                        className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                      </select>
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
