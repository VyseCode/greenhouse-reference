import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession } from "@/lib/auth";
import {
  MAX_PAGE_SIZE,
  STAFF_ROLES,
  type Role,
} from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ApiError) return fail(error.message, error.status);
  if (error instanceof ZodError) {
    return fail(error.issues[0]?.message ?? "Invalid input", 400);
  }
  if (error instanceof SyntaxError) return fail("Invalid JSON body", 400);
  if (error instanceof Error) {
    const code = (error as Error & { code?: number }).code;
    if (code === 11000) return fail("That record already exists", 409);
    if (error.name === "CastError") return fail("Invalid identifier", 400);
    if (error.name === "ValidationError") return fail(error.message, 400);
  }
  console.error("[api] unexpected error:", error);
  return fail("Something went wrong. Please try again.", 500);
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json();
}

export function parseId(value: string, label = "identifier"): string {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return value;
}

export function pagination(params: URLSearchParams, defaultLimit = 20) {
  const rawPage = Number(params.get("page") ?? "1");
  const rawLimit = Number(params.get("limit") ?? String(defaultLimit));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), MAX_PAGE_SIZE)
      : Math.min(defaultLimit, MAX_PAGE_SIZE);
  return { page, limit, skip: (page - 1) * limit };
}

export async function requireUser(): Promise<AuthUser> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "You must be signed in");
  await connectDB();
  const user = await User.findById(session.userId)
    .select("name email role")
    .lean();
  if (!user) throw new ApiError(401, "Your session is no longer valid");
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function assertRole(user: AuthUser, roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw new ApiError(403, "You do not have access to this resource");
  }
}

export async function requireStaff(): Promise<AuthUser> {
  const user = await requireUser();
  assertRole(user, STAFF_ROLES);
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  assertRole(user, ["admin"]);
  return user;
}
