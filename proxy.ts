import { NextResponse, type NextRequest } from "next/server";
import { STAFF_ROLES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";
import { User } from "@/models/User";

const STAFF_PREFIXES = [
  "/dashboard",
  "/jobs/manage",
  "/applications",
  "/board",
  "/offers",
  "/reports",
];

function isStaffPath(pathname: string) {
  return (
    STAFF_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) || /^\/jobs\/[^/]+\/edit$/.test(pathname)
  );
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { pathname } = new URL(request.url);
  if (isStaffPath(pathname)) {
    await connectDB();
    const user = await User.findById(session.userId).select("role").lean();
    if (!user || !STAFF_ROLES.includes(user.role)) {
      return NextResponse.redirect(new URL("/interviews", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/manage/:path*",
    "/jobs/:id/edit",
    "/applications/:path*",
    "/board/:path*",
    "/offers/:path*",
    "/interviews/:path*",
    "/reports/:path*",
  ],
};
