import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCanEditUniverse } from "@/lib/auth-utils";
import { getCurrentUniverseId } from "@/lib/universe";
import CharacterForm from "../[id]/CharacterForm";

export default async function NewCharacterPage() {
  const universeId = await getCurrentUniverseId().catch(() => null);
  if (!universeId) redirect("/admin");

  const canEdit = await getCanEditUniverse(universeId);
  if (!canEdit) redirect("/admin");

  const [allChars, speciesRows, customRoleRows, session] = await Promise.all([
    prisma.character.findMany({
      where: { universeId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
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

  return (
    <CharacterForm
      allChars={allChars}
      customSpecies={speciesRows.map((s) => s.name)}
      customRoles={customRoleRows}
      isSuperAdmin={session?.isSuperAdmin ?? false}
      universeId={universeId}
    />
  );
}
