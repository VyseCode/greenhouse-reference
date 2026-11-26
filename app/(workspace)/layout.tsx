import { WorkspaceNav } from "@/components/WorkspaceNav";
import { requirePageUser } from "@/lib/page-auth";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <WorkspaceNav user={user} />
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-8 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}
