"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUniverseEdit } from "@/lib/auth-utils";

export type CharacterState = { error?: string; success?: string; id?: string } | null;

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function createCharacter(
  _prev: CharacterState,
  formData: FormData
): Promise<CharacterState> {
  const { universeId } = await requireUniverseEdit();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required." };

  const roles = formData.getAll("roles") as string[];

  const newChar = await prisma.character.create({
    data: {
      universeId,
      name,
      characterType: (formData.get("characterType") as string) || "Human",
      subtype:       (formData.get("subtype") as string)?.trim() || null,
      hairColor:     (formData.get("hairColor") as string)?.trim() || null,
      eyeColor:      (formData.get("eyeColor") as string)?.trim() || null,
      bodyType:      (formData.get("bodyType") as string)?.trim() || null,
      attitude:      (formData.get("attitude") as string)?.trim() || null,
      quirks:        (formData.get("quirks") as string)?.trim() || null,
      speakingStyle: (formData.get("speakingStyle") as string)?.trim() || null,
      phrases:       (formData.get("phrases") as string)?.trim() || null,
      origin:        (formData.get("origin") as string)?.trim() || null,
      livesIn:       (formData.get("livesIn") as string)?.trim() || null,
      homeDescription:(formData.get("homeDescription") as string)?.trim() || null,
      vehicles:      (formData.get("vehicles") as string)?.trim() || null,
      jobs:          (formData.get("jobs") as string)?.trim() || null,
      pets:          (formData.get("pets") as string)?.trim() || null,
      notes:         (formData.get("notes") as string)?.trim() || null,
      roles: roles.length > 0
        ? { createMany: { data: roles.map((role) => ({ role })), skipDuplicates: true } }
        : undefined,
    },
  });

  const pendingRelStrings = formData.getAll("pendingRel") as string[];
  if (pendingRelStrings.length > 0) {
    type PR = { otherId: string; type: string; note: string };
    const rels: PR[] = pendingRelStrings.map((s) => JSON.parse(s));
    await prisma.characterRelationship.createMany({
      data: rels
        .filter((r) => r.otherId && r.otherId !== newChar.id && r.type?.trim())
        .map((r) => ({
          fromCharacterId: newChar.id,
          toCharacterId: r.otherId,
          type: r.type.trim(),
          note: r.note?.trim() || null,
        })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/admin", "layout");
  return { success: "Character created.", id: newChar.id };
}

export async function updateCharacter(
  _prev: CharacterState,
  formData: FormData
): Promise<CharacterState> {
  const { universeId } = await requireUniverseEdit();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!id) return { error: "ID missing." };
  if (!name) return { error: "Name is required." };

  const existing = await prisma.character.findFirst({ where: { id, universeId } });
  if (!existing) return { error: "Character not found." };

  const roles = formData.getAll("roles") as string[];

  await prisma.$transaction([
    prisma.character.update({
      where: { id },
      data: {
        name,
        characterType: (formData.get("characterType") as string) || "Human",
        subtype:       (formData.get("subtype") as string)?.trim() || null,
        hairColor:     (formData.get("hairColor") as string)?.trim() || null,
        eyeColor:      (formData.get("eyeColor") as string)?.trim() || null,
        bodyType:      (formData.get("bodyType") as string)?.trim() || null,
        attitude:      (formData.get("attitude") as string)?.trim() || null,
        quirks:        (formData.get("quirks") as string)?.trim() || null,
        speakingStyle: (formData.get("speakingStyle") as string)?.trim() || null,
        phrases:       (formData.get("phrases") as string)?.trim() || null,
        origin:        (formData.get("origin") as string)?.trim() || null,
        livesIn:       (formData.get("livesIn") as string)?.trim() || null,
        homeDescription:(formData.get("homeDescription") as string)?.trim() || null,
        vehicles:      (formData.get("vehicles") as string)?.trim() || null,
        jobs:          (formData.get("jobs") as string)?.trim() || null,
        pets:          (formData.get("pets") as string)?.trim() || null,
        notes:         (formData.get("notes") as string)?.trim() || null,
      },
    }),
    prisma.characterRole.deleteMany({ where: { characterId: id } }),
    ...(roles.length > 0
      ? [prisma.characterRole.createMany({
          data: roles.map((role) => ({ characterId: id, role })),
          skipDuplicates: true,
        })]
      : []),
  ]);

  revalidatePath(`/admin/characters/${id}`);
  revalidatePath("/admin", "layout");
  return { success: "Character saved." };
}

export async function deleteCharacter(id: string): Promise<void> {
  const { universeId } = await requireUniverseEdit();
  const existing = await prisma.character.findFirst({ where: { id, universeId } });
  if (!existing) return;
  await prisma.character.delete({ where: { id } });
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

// ── Relationships ────────────────────────────────────────────────────────────

export async function addRelationship(
  fromCharacterId: string,
  toCharacterId: string,
  type: string,
  note: string
): Promise<{ error?: string }> {
  const { universeId } = await requireUniverseEdit();

  if (!fromCharacterId || !toCharacterId) return { error: "Both characters required." };
  if (fromCharacterId === toCharacterId) return { error: "A character cannot relate to themselves." };
  if (!type.trim()) return { error: "Relationship type is required." };

  // Verify both characters belong to this universe
  const [from, to] = await Promise.all([
    prisma.character.findFirst({ where: { id: fromCharacterId, universeId } }),
    prisma.character.findFirst({ where: { id: toCharacterId,   universeId } }),
  ]);
  if (!from || !to) return { error: "Character not found in this universe." };

  await prisma.characterRelationship.create({
    data: {
      fromCharacterId,
      toCharacterId,
      type,
      note: note.trim() || null,
    },
  });

  revalidatePath(`/admin/characters/${fromCharacterId}`);
  return {};
}

export async function removeRelationship(id: string, characterId: string): Promise<void> {
  await requireUniverseEdit();
  await prisma.characterRelationship.delete({ where: { id } }).catch(() => null);
  revalidatePath(`/admin/characters/${characterId}`);
}
