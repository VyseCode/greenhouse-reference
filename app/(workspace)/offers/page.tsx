import type { Metadata } from "next";
import { OfferList } from "@/components/OfferList";
import { connectDB } from "@/lib/db";
import { requirePageStaff } from "@/lib/page-auth";
import { listOffers } from "@/lib/queries";

export const metadata: Metadata = { title: "Offers — Rowan" };

export default async function OffersPage(props: PageProps<"/offers">) {
  await requirePageStaff();
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  await connectDB();
  const data = await listOffers(params);
  return <OfferList data={data} params={{ status: params.get("status") ?? "", page: data.page }} />;
}
