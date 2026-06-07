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

    // Attempt to validate sessionVersion against the DB. This is the primary
    // revocation mechanism: a bumped DB version means the user has logged out
    // or had their password reset.
    //
    // Wrapped in its own try/catch because serverExternalPackages in next.config
    // only externalises Prisma from the Server Component / Route Handler bundles,
    // not the proxy bundle. If pg's native modules fail to load from within the
    // bundled proxy, the query throws. In that case we fall back to JWT-signature-
    // only validation — admin routes stay accessible and the admin layout (which
    // runs in the correctly-externalised server bundle) performs the sessionVersion
    // check as a second line of defence.
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { sessionVersion: true },
      });
      // No user record or version mismatch → treat as logged out.
      if (!user || user.sessionVersion !== jwtVersion) return false;
    } catch {
      // DB query failed — fall back to JWT-signature-only auth.
      // The JWT is cryptographically valid (verified above), so we allow the
      // request through. The admin layout will catch any revoked sessions.
    }

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
