import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`login:${clientIp(request)}`, 12, 15 * 60 * 1000);
    if (!limit.allowed) {
      return fail(`Too many attempts. Try again in ${limit.retryAfter}s.`, 429);
    }

    const body = loginSchema.parse(await readJson(request));
    await connectDB();

    const user = await User.findOne({ email: body.email }).select("+password");
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      return fail("Invalid email or password", 401);
    }

    const token = await signSession({
      userId: user._id.toString(),
      email: user.email,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    return ok({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
