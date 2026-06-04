import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
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

  const [character, allCharsRaw, relationships] = await Promise.all([
    prisma.character.findFirst({ where: { id, universeId } }),

    // All other characters in the universe (for the relationship dropdown)
    prisma.character.findMany({
      where: { universeId, NOT: { id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),

    // All relationships involving this character (as from OR to)
    prisma.characterRelationship.findMany({
      where: {
        OR: [{ fromCharacterId: id }, { toCharacterId: id }],
      },
      include: {
        fromCharacter: { select: { id: true, name: true } },
        toCharacter:   { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!character) notFound();

  return (
    <CharacterForm
      character={character}
      allChars={allCharsRaw}
      relationships={relationships}
    />
  );
}
