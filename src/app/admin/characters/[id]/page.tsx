import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCanEditUniverse } from "@/lib/auth-utils";
import CharacterForm from "./CharacterForm";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const [character, allCharsRaw, relationships, speciesRows, customRoleRows, session] =
    await Promise.all([
      prisma.character.findFirst({
        where: { id, universeId },
        include: { roles: { select: { role: true } } },
      }),
      prisma.character.findMany({
        where: { universeId, NOT: { id } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.characterRelationship.findMany({
        where: { OR: [{ fromCharacterId: id }, { toCharacterId: id }] },
        include: {
          fromCharacter: { select: { id: true, name: true } },
          toCharacter:   { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.species.findMany({
        where: { universeId },
        orderBy: { name: "asc" },
        select: { name: true },
      }),
      prisma.customRole.findMany({
        where: { universeId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      import("@/lib/session").then((m) => m.getSession()),
    ]);

  if (!character) notFound();

  const canEdit = await getCanEditUniverse(universeId);

  return (
    <CharacterForm
      character={character}
      allChars={allCharsRaw}
      relationships={relationships}
      customSpecies={speciesRows.map((s) => s.name)}
      currentRoles={character.roles.map((r) => r.role)}
      customRoles={customRoleRows}
      isSuperAdmin={session?.isSuperAdmin ?? false}
      canEdit={canEdit}
      universeId={universeId}
    />
  );
}
