"use server";

import { redirect } from "next/navigation";
import { requireUniverseEdit } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type LocationState = { error?: string; success?: string } | null;


export async function createLocation(
  _prev: LocationState,
  formData: FormData
): Promise<LocationState> {
  const { universeId } = await requireUniverseEdit();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required." };

  await prisma.location.create({
    data: {
      universeId,
      name,
      locatedIn:   (formData.get("locatedIn") as string)?.trim() || null,
      climate:     (formData.get("climate") as string)?.trim() || null,
      atmosphere:  (formData.get("atmosphere") as string)?.trim() || null,
      description: (formData.get("description") as string)?.trim() || null,
      notes:       (formData.get("notes") as string)?.trim() || null,
    },
  });

  revalidatePath("/admin", "layout");
  return { success: "Location created." };
}

export async function updateLocation(
  _prev: LocationState,
  formData: FormData
): Promise<LocationState> {
  const { universeId } = await requireUniverseEdit();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!id) return { error: "ID missing." };
  if (!name) return { error: "Name is required." };

  const existing = await prisma.location.findFirst({ where: { id, universeId } });
  if (!existing) return { error: "Location not found." };

  await prisma.location.update({
    where: { id },
    data: {
      name,
      locatedIn:   (formData.get("locatedIn") as string)?.trim() || null,
      climate:     (formData.get("climate") as string)?.trim() || null,
      atmosphere:  (formData.get("atmosphere") as string)?.trim() || null,
      description: (formData.get("description") as string)?.trim() || null,
      notes:       (formData.get("notes") as string)?.trim() || null,
    },
  });

  revalidatePath(`/admin/locations/${id}`);
  revalidatePath("/admin", "layout");
  return { success: "Location saved." };
}

export async function deleteLocation(id: string): Promise<void> {
  const { universeId } = await requireUniverseEdit();
  const existing = await prisma.location.findFirst({ where: { id, universeId } });
  if (!existing) return;
  await prisma.location.delete({ where: { id } });
  revalidatePath("/admin", "layout");
  redirect("/admin");
}
