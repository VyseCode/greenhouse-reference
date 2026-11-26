import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const SESSION_COOKIE = "rowan_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-secret-change-me-before-deploying",
);

export type Session = {
  userId: string;
  email: string;
};

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ email: session.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
    };
  } catch {
    return null;
  }
}

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

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
