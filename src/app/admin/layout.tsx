import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import SidebarClient from "@/components/SidebarClient";
import PopupLayer from "@/components/PopupLayer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // If this user's password was reset and they haven't changed it yet, block access.
  const userRecord = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { forcePasswordChange: true },
  });
  if (userRecord?.forcePasswordChange) redirect("/force-change-password");

  // Universe selector — archived universes never appear in the sidebar/selector.
  // Everyone (including superadmin) sees only universes they created or were shared with.
  // Superadmin also sees legacy universes with no owner (createdByUserId = null).
  const universes = await prisma.universe.findMany({
    where: {
      archivedAt: null,
      OR: [
        { createdByUserId: session.userId },
        ...(session.isSuperAdmin ? [{ createdByUserId: null }] : []),
        { accesses: { some: { userId: session.userId } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  const cookieStore = await cookies();
  const cookieId = cookieStore.get("selected-universe")?.value ?? null;
  const currentUniverseId =
    cookieId && universes.some((u) => u.id === cookieId)
      ? cookieId
      : (universes[0]?.id ?? null);

  // Sidebar data — scoped to current universe
  const [ideas, notes, plotItems, characters, locations, images] = currentUniverseId
    ? await Promise.all([
        prisma.storylineIdea.findMany({
          where: { universeId: currentUniverseId },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, content: true, createdAt: true },
        }),
        prisma.note.findMany({
          where: { universeId: currentUniverseId },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, content: true, createdAt: true },
        }),
        prisma.plotItem.findMany({
          where: { universeId: currentUniverseId },
          orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
          select: { id: true, text: true, checked: true },
        }),
        prisma.character.findMany({
          where: { universeId: currentUniverseId },
          orderBy: { name: "asc" },
          select: {
            id: true, name: true, characterType: true, notes: true, createdAt: true,
            roles: { select: { role: true } },
          },
        }),
        prisma.location.findMany({
          where: { universeId: currentUniverseId },
          orderBy: { name: "asc" },
          select: { id: true, name: true, locatedIn: true, atmosphere: true, createdAt: true },
        }),
        // Fetch image metadata only — binary data is served via /api/images/[id]
        prisma.image.findMany({
          where: { universeId: currentUniverseId },
          orderBy: { createdAt: "desc" },
          select: { id: true, label: true, category: true, createdAt: true },
        }),
      ])
    : [[], [], [], [], [], []];

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <AdminNav
        username={session.username}
        universes={universes}
        currentUniverseId={currentUniverseId}
        isSuperAdmin={session.isSuperAdmin}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <SidebarClient
          universeId={currentUniverseId}
          ideas={ideas}
          notes={notes}
          plotItems={plotItems}
          characters={characters}
          locations={locations}
          images={images}
          isSuperAdmin={session.isSuperAdmin}
        />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "2.5rem 2rem",
          }}
        >
          {children}
        </main>
      </div>

      {/* Popup layer — Suspense required because it reads useSearchParams */}
      <Suspense>
        <PopupLayer
          ideas={ideas}
          notes={notes}
          characters={characters}
          locations={locations}
          images={images}
          universeId={currentUniverseId}
        />
      </Suspense>
    </div>
  );
}
