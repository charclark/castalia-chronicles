"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentUniverseId } from "@/lib/universe";

export type CharacterState = { error?: string; success?: string } | null;

async function auth() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function createCharacter(
  _prev: CharacterState,
  formData: FormData
): Promise<CharacterState> {
  await auth();
  const universeId = await getCurrentUniverseId();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required." };

  const character = await prisma.character.create({
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
    },
  });

  redirect(`/admin/characters/${character.id}`);
}

export async function updateCharacter(
  _prev: CharacterState,
  formData: FormData
): Promise<CharacterState> {
  await auth();
  const universeId = await getCurrentUniverseId();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!id) return { error: "ID missing." };
  if (!name) return { error: "Name is required." };

  const existing = await prisma.character.findFirst({ where: { id, universeId } });
  if (!existing) return { error: "Character not found." };

  await prisma.character.update({
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
  });

  revalidatePath(`/admin/characters/${id}`);
  revalidatePath("/admin", "layout");
  return { success: "Character saved." };
}

export async function deleteCharacter(id: string): Promise<void> {
  await auth();
  const universeId = await getCurrentUniverseId();
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
  await auth();
  const universeId = await getCurrentUniverseId();

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
  await auth();
  await prisma.characterRelationship.delete({ where: { id } }).catch(() => null);
  revalidatePath(`/admin/characters/${characterId}`);
}
