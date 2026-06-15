import "server-only";
import { cookies } from "next/headers";
import { getSession } from "./session";
import { prisma } from "./prisma";

export async function getCurrentUniverseId(): Promise<string> {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get("selected-universe")?.value ?? null;

  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  // Load all universes this user can access so we can validate the cookie.
  const accessible = await prisma.universe.findMany({
    where: {
      archivedAt: null,
      OR: [
        { createdByUserId: session.userId },
        { accesses: { some: { userId: session.userId } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (accessible.length === 0) throw new Error("No universe available.");

  // Validate the cookie against the accessible set; fall back to the first
  // accessible universe if the cookie is missing or stale.
  const validated =
    (cookieId && accessible.find((u) => u.id === cookieId)?.id) ||
    accessible[0].id;

  // Persist the resolved ID so subsequent cookie reads work correctly.
  // This succeeds in Server Actions and Route Handlers; silently skipped in
  // plain Server Component renders where cookie writes are not permitted.
  try {
    cookieStore.set("selected-universe", validated, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch {
    // Server Component renders cannot set cookies — that's fine.
  }

  return validated;
}
