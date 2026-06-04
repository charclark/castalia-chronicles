"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentUniverseId } from "@/lib/universe";

export type WorkState = { error?: string; success?: string } | null;

async function auth() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
}

export async function createWork(
  type: "book" | "short story"
): Promise<void> {
  await auth();
  const universeId = await getCurrentUniverseId();

  const title = type === "book" ? "Untitled Book" : "Untitled Short Story";

  const work = await prisma.work.create({
    data: { universeId, title, type, status: "private" },
  });

  redirect(`/admin/works/${work.id}`);
}

export async function renameWork(
  _prev: WorkState,
  formData: FormData
): Promise<WorkState> {
  await auth();
  const universeId = await getCurrentUniverseId();
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();

  if (!id) return { error: "ID missing." };
  if (!title) return { error: "Title is required." };

  const existing = await prisma.work.findFirst({ where: { id, universeId } });
  if (!existing) return { error: "Work not found." };

  await prisma.work.update({ where: { id }, data: { title } });

  revalidatePath(`/admin/works/${id}`);
  revalidatePath("/admin/works");
  revalidatePath("/admin", "layout");
  return { success: "Title saved." };
}

export async function setCoverImage(
  _prev: WorkState,
  formData: FormData
): Promise<WorkState> {
  await auth();
  const universeId = await getCurrentUniverseId();
  const id = formData.get("id") as string;
  const coverImageId = (formData.get("coverImageId") as string) || null;

  if (!id) return { error: "ID missing." };

  const existing = await prisma.work.findFirst({ where: { id, universeId } });
  if (!existing) return { error: "Work not found." };

  // Verify image belongs to same universe (if provided)
  if (coverImageId) {
    const img = await prisma.image.findFirst({ where: { id: coverImageId, universeId } });
    if (!img) return { error: "Image not found in this universe." };
  }

  await prisma.work.update({ where: { id }, data: { coverImageId } });

  revalidatePath(`/admin/works/${id}`);
  return { success: "Cover updated." };
}

export async function deleteWork(id: string): Promise<void> {
  await auth();
  const universeId = await getCurrentUniverseId();
  const existing = await prisma.work.findFirst({ where: { id, universeId } });
  if (!existing) return;
  await prisma.work.delete({ where: { id } });
  revalidatePath("/admin/works");
  revalidatePath("/admin", "layout");
  redirect("/admin/works");
}
