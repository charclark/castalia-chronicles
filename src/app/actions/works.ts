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

export async function saveWorkContent(
  id: string,
  content: string
): Promise<{ error?: string }> {
  await auth();
  const universeId = await getCurrentUniverseId();
  const existing = await prisma.work.findFirst({ where: { id, universeId } });
  if (!existing) return { error: "Work not found." };
  await prisma.work.update({ where: { id }, data: { content } });
  return {};
}

export async function publishWork(
  id: string,
  mode: "whole" | "snippet",
  snippet?: string
): Promise<{ error?: string }> {
  await auth();
  const universeId = await getCurrentUniverseId();
  const existing = await prisma.work.findFirst({ where: { id, universeId } });
  if (!existing) return { error: "Work not found." };

  if (mode === "snippet" && !snippet?.trim()) {
    return { error: "Snippet text is required when publishing a teaser." };
  }

  await prisma.work.update({
    where: { id },
    data: {
      status: "published",
      publishMode: mode,
      snippet: mode === "snippet" ? snippet!.trim() : null,
      // Preserve original publishedAt if re-publishing after unpublishing
      publishedAt: existing.publishedAt ?? new Date(),
    },
  });

  revalidatePath(`/admin/works/${id}`);
  revalidatePath("/admin/works");
  revalidatePath("/admin", "layout");
  return {};
}

export async function unpublishWork(id: string): Promise<{ error?: string }> {
  await auth();
  const universeId = await getCurrentUniverseId();
  const existing = await prisma.work.findFirst({ where: { id, universeId } });
  if (!existing) return { error: "Work not found." };

  await prisma.work.update({
    where: { id },
    data: { status: "private", publishMode: null, snippet: null },
  });

  revalidatePath(`/admin/works/${id}`);
  revalidatePath("/admin/works");
  revalidatePath("/admin", "layout");
  return {};
}

// Called by public reader pages — no admin auth required.
// Only increments when the work is actually published (safe: count only,
// no sensitive data exposed).
export async function incrementOpenCount(id: string): Promise<void> {
  await prisma.work.updateMany({
    where: { id, status: "published" },
    data: { openCount: { increment: 1 } },
  });
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
