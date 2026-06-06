import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

// Validates the session cookie by:
// 1. Verifying the JWT signature and expiry.
// 2. Checking that the sessionVersion in the JWT matches the current value in
//    the database — a mismatch means the user has been logged out (or their
//    password was reset) and the JWT must be treated as revoked.
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("session")?.value;
  if (!token) return false;
  const key = getEncodedKey();
  if (!key) return false;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const userId = payload.userId as string | undefined;
    const jwtVersion = (payload.sessionVersion as number | undefined) ?? 1;
    if (!userId) return false;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sessionVersion: true },
    });
    // No user record, or version bumped since JWT was issued → treat as logged out.
    if (!user || user.sessionVersion !== jwtVersion) return false;

    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // Protect all /admin routes
    if (pathname.startsWith("/admin")) {
      if (!(await isAuthenticated(request))) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // Redirect already-logged-in users away from /login.
    // The sessionVersion check ensures a user who just logged out is NOT
    // considered authenticated even if their old cookie briefly lingers —
    // fixing the redirect loop that previously trapped users after logout.
    if (pathname === "/login") {
      if (await isAuthenticated(request)) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Fail safe: if anything goes wrong inside the proxy, protect admin routes
    // by redirecting to login rather than accidentally allowing access.
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  // "/admin" (exact) + "/admin/*" (all sub-paths) + "/login"
  matcher: ["/admin", "/admin/:path*", "/login"],
};
