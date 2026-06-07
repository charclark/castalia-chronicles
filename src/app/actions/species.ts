"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUniverseEdit } from "@/lib/auth-utils";
import { STANDARD_SPECIES } from "@/lib/species-constants";

export async function createSpecies(
  universeId: string,
  name: string,
  color: string,
  shape: string
): Promise<{ error?: string }> {
  await requireUniverseEdit();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };
  if (trimmed.length > 60) return { error: "Name is too long." };
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: "Invalid color." };
  if (!["circle", "triangle", "diamond", "square"].includes(shape))
    return { error: "Invalid shape." };

  if (STANDARD_SPECIES.some((s) => s.toLowerCase() === trimmed.toLowerCase()))
    return { error: `"${trimmed}" is a standard species and cannot be added as custom.` };

  const existing = await prisma.species.findUnique({
    where: { universeId_name: { universeId, name: trimmed } },
  });
  if (existing) return { error: "A species with that name already exists." };

  await prisma.species.create({ data: { universeId, name: trimmed, color, shape } });
  revalidatePath("/admin");
  return {};
}

export async function deleteSpecies(id: string): Promise<{ error?: string }> {
  await requireUniverseEdit();
  await prisma.species.delete({ where: { id } });
  revalidatePath("/admin");
  return {};
}
