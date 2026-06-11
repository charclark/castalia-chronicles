import "server-only";
import { cookies } from "next/headers";
import { getSession } from "./session";
import { prisma } from "./prisma";

export async function getCurrentUniverseId(): Promise<string> {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get("selected-universe")?.value ?? null;

  if (cookieId) return cookieId;

  // Cookie missing — find the first universe this user has access to.
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const first = await prisma.universe.findFirst({
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

  if (!first) throw new Error("No universe available.");

  // Persist the resolved ID so subsequent cookie reads work correctly.
  // This succeeds in Server Actions and Route Handlers; silently skipped in
  // plain Server Component renders where cookie writes are not permitted.
  try {
    cookieStore.set("selected-universe", first.id, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch {
    // Server Component renders cannot set cookies — that's fine.
  }

  return first.id;
}
