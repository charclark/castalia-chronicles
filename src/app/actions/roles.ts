"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, requireUniverseEdit } from "@/lib/auth-utils";

export const DEFAULT_ROLES = [
  "Protagonist",
  "Antagonist",
  "Principal",
  "Supporting",
  "Wildcard",
  "Catalyst",
  "Shadow",
  "Minor",
] as const;

export async function createCustomRole(
  universeId: string,
  name: string
): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };
  if (trimmed.length > 60) return { error: "Name is too long." };

  const isDefault = DEFAULT_ROLES.some(
    (r) => r.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDefault) return { error: "That role already exists as a default." };

  const existing = await prisma.customRole.findUnique({
    where: { universeId_name: { universeId, name: trimmed } },
  });
  if (existing) return { error: "A role with that name already exists." };

  await prisma.customRole.create({ data: { universeId, name: trimmed } });
  revalidatePath("/admin");
  return {};
}

export async function deleteCustomRole(id: string): Promise<{ error?: string }> {
  await requireSuperAdmin();
  await prisma.customRole.delete({ where: { id } });
  revalidatePath("/admin");
  return {};
}

// Replaces all roles for a character with the given list.
export async function setCharacterRoles(
  characterId: string,
  roles: string[]
): Promise<{ error?: string }> {
  await requireUniverseEdit();

  await prisma.characterRole.deleteMany({ where: { characterId } });
  if (roles.length > 0) {
    await prisma.characterRole.createMany({
      data: roles.map((role) => ({ characterId, role })),
      skipDuplicates: true,
    });
  }
  revalidatePath(`/admin/characters/${characterId}`);
  return {};
}
