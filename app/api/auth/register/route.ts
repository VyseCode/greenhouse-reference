import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`register:${clientIp(request)}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return fail(`Too many attempts. Try again in ${limit.retryAfter}s.`, 429);
    }

    const body = registerSchema.parse(await readJson(request));
    await connectDB();

    if (await User.exists({ email: body.email })) {
      return fail("An account with that email already exists", 409);
    }

    const password = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      name: body.name,
      email: body.email,
      password,
      role: body.role,
      title: "",
    });

    const token = await signSession({
      userId: user._id.toString(),
      email: user.email,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    return ok(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
