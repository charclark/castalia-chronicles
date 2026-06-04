import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CharacterForm from "../[id]/CharacterForm";

export default async function NewCharacterPage() {
  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  // Other characters for the relationships dropdown (empty on new character)
  const allChars = await prisma.character.findMany({
    where: { universeId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return <CharacterForm allChars={allChars} />;
}
