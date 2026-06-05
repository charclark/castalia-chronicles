import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId)
    return new NextResponse("No universe selected", { status: 400 });

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
