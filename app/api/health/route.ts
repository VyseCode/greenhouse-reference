import { ok } from "@/lib/api";

export async function GET() {
  return ok({ service: "rowan-ats", status: "healthy", at: new Date().toISOString() });
}
