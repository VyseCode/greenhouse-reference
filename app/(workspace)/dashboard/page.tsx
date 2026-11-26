import { requirePageStaff } from "@/lib/page-auth";

export default async function DashboardPage() {
  const user = await requirePageStaff();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Good to see you, {user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted">Your hiring workspace is ready.</p>
    </div>
  );
}
