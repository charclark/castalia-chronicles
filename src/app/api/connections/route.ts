import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  // Resolve the universe to query using the same fallback logic as the admin layout:
  // if the cookie holds a stale ID (a universe the user can no longer access), fall
  // back to the first universe in their accessible list rather than returning nothing.
  const accessibleUniverses = await prisma.universe.findMany({
    where: {
      archivedAt: null,
      OR: [
        { createdByUserId: session.userId },
        ...(session.isSuperAdmin ? [{ createdByUserId: null }] : []),
        { accesses: { some: { userId: session.userId } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (accessibleUniverses.length === 0)
    return new NextResponse("No accessible universes", { status: 400 });

  const cookieStore = await cookies();
  const cookieId = cookieStore.get("selected-universe")?.value ?? null;
  const universeId =
    cookieId && accessibleUniverses.some((u) => u.id === cookieId)
      ? cookieId
      : accessibleUniverses[0].id;

  // If the cookie was stale, write the corrected ID back.
  // This is a Route Handler so cookie writes are permitted here.
  if (universeId !== cookieId) {
    cookieStore.set("selected-universe", universeId, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const [characters, relationships, species, charRolesRaw] = await Promise.all([
    prisma.character.findMany({
      where: { universeId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, characterType: true },
    }),
    prisma.characterRelationship.findMany({
      where: { fromCharacter: { universeId } },
      select: {
        id: true,
        fromCharacterId: true,
        toCharacterId: true,
        type: true,
        note: true,
      },
    }),
    prisma.species.findMany({
      where: { universeId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true, shape: true },
    }),
    prisma.characterRole.findMany({
      where: { character: { universeId } },
      select: { characterId: true, role: true },
    }),
  ]);

  // Build a map: characterId -> string[]
  const charRoles: Record<string, string[]> = {};
  for (const { characterId, role } of charRolesRaw) {
    (charRoles[characterId] ??= []).push(role);
  }

  return NextResponse.json({ characters, relationships, species, charRoles });
}
