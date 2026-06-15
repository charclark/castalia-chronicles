"use server";

import { redirect } from "next/navigation";
import { requireUniverseEdit } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ImageState = { error?: string; success?: string } | null;


export async function uploadImage(
  _prev: ImageState,
  formData: FormData
): Promise<ImageState> {
  const { universeId } = await requireUniverseEdit();

  const file = formData.get("file") as File | null;
  const label = (formData.get("label") as string)?.trim();
  const category = (formData.get("category") as string) || "other";

  if (!file || file.size === 0) return { error: "No file selected." };
  if (!label) return { error: "Label is required." };
  // Guard against oversized uploads (client should compress, but belt-and-suspenders)
  if (file.size > 8 * 1024 * 1024) return { error: "File too large (max 8 MB after compression)." };

  const arrayBuffer = await file.arrayBuffer();
  const data = Buffer.from(arrayBuffer);
  const mimeType = file.type || "image/jpeg";

  await prisma.image.create({
    data: { universeId, label, category, mimeType, data },
  });

  revalidatePath("/admin", "layout");
  return { success: "Image added successfully." };
}

export async function updateImage(
  _prev: ImageState,
  formData: FormData
): Promise<ImageState> {
  const { universeId } = await requireUniverseEdit();
  const id = formData.get("id") as string;
  const label = (formData.get("label") as string)?.trim();
  const category = (formData.get("category") as string) || "other";

  if (!id) return { error: "ID missing." };
  if (!label) return { error: "Label is required." };

  const existing = await prisma.image.findFirst({ where: { id, universeId } });
  if (!existing) return { error: "Image not found." };

  await prisma.image.update({ where: { id }, data: { label, category } });

  revalidatePath(`/admin/images/${id}`);
  revalidatePath("/admin", "layout");
  return { success: "Saved." };
}

export async function deleteImage(id: string): Promise<void> {
  const { universeId } = await requireUniverseEdit();
  const existing = await prisma.image.findFirst({ where: { id, universeId } });
  if (!existing) return;
  await prisma.image.delete({ where: { id } });
  revalidatePath("/admin", "layout");
  redirect("/admin");
}
