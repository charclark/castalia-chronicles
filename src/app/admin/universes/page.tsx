import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import UniverseManager from "./UniverseManager";
import ArchivedUniverses from "./ArchivedUniverses";

export default async function UniversesPage() {
  const session = await getSession();
  if (!session) return null;
  const isSuperAdmin = session.isSuperAdmin;

  // Active universes
  const universes = isSuperAdmin
    ? await prisma.universe.findMany({
        where: { archivedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          accesses: {
            include: { user: { select: { id: true, username: true } } },
          },
        },
      })
    : await prisma.universe.findMany({
        where: {
          archivedAt: null,
          OR: [
            { createdByUserId: session.userId },
            { isPrivate: false, accesses: { some: { userId: session.userId } } },
          ],
        },
        orderBy: { createdAt: "asc" },
      });

  const cookieStore = await cookies();
  const selectedId = cookieStore.get("selected-universe")?.value ?? null;

  const otherUsers = isSuperAdmin
    ? await prisma.user.findMany({
        where: { isSuperAdmin: false },
        orderBy: { username: "asc" },
        select: { id: true, username: true },
      })
    : [];

  // Archived universes — Char only, archived by non-Char users
  const archivedUniverses = isSuperAdmin
    ? await prisma.universe.findMany({
        where: { archivedAt: { not: null } },
        orderBy: { archivedAt: "desc" },
        include: {
          createdBy: { select: { username: true } },
          archivedBy: { select: { username: true } },
        },
      })
    : [];

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.4rem",
        }}
      >
        Universes
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginBottom: "2.5rem",
        }}
      >
        Each universe is a fully isolated world — its own characters, locations, and stories.
      </p>

      <UniverseManager
        universes={universes}
        selectedId={selectedId}
        isSuperAdmin={isSuperAdmin}
        currentUserId={session.userId}
        otherUsers={otherUsers}
      />

      {isSuperAdmin && archivedUniverses.length > 0 && (
        <ArchivedUniverses universes={archivedUniverses} />
      )}
    </div>
  );
}
