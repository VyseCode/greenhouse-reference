import { cookies } from "next/headers";
import type { Role } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  verifySession,
  type Session,
} from "@/lib/session-token";

export {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  verifySession,
  type Session,
};

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.userId)
    .select("name email role title")
    .lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
  };
}
