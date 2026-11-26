import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";

export async function requirePageUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePageStaff(): Promise<CurrentUser> {
  const user = await requirePageUser();
  if (!STAFF_ROLES.includes(user.role)) redirect("/interviews");
  return user;
}
