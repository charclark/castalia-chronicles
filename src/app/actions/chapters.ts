"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUniverseEdit } from "@/lib/auth-utils";

export type ChapterState = { error?: string; success?: string } | null;

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function createChapter(workId: string): Promise<{ id?: string; error?: string }> {
  const { universeId } = await requireUniverseEdit();

  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found." };

  // Place new chapter at the end
  const last = await prisma.chapter.findFirst({
    where: { workId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (last?.order ?? -1) + 1;
  const chapterNumber = nextOrder + 1;

  const chapter = await prisma.chapter.create({
    data: {
      workId,
      title: `Chapter ${chapterNumber}`,
      order: nextOrder,
    },
  });

  revalidatePath(`/admin/works/${workId}/editor`);
  return { id: chapter.id };
}

export async function renameChapter(
  chapterId: string,
  workId: string,
  title: string
): Promise<{ error?: string }> {
  const { universeId } = await requireUniverseEdit();

  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found." };

  const trimmed = title.trim();
  if (!trimmed) return { error: "Title cannot be empty." };
  if (trimmed.length > 200) return { error: "Title is too long." };

  await prisma.chapter.update({ where: { id: chapterId }, data: { title: trimmed } });
  return {};
}

export async function deleteChapter(
  chapterId: string,
  workId: string
): Promise<{ error?: string }> {
  const { universeId } = await requireUniverseEdit();

  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found." };

  await prisma.chapter.delete({ where: { id: chapterId } });

  // Re-normalize order values so they stay contiguous (0, 1, 2, …)
  const remaining = await prisma.chapter.findMany({
    where: { workId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  await Promise.all(
    remaining.map((c, i) =>
      prisma.chapter.update({ where: { id: c.id }, data: { order: i } })
    )
  );

  revalidatePath(`/admin/works/${workId}/editor`);
  return {};
}

export async function saveChapterContent(
  chapterId: string,
  workId: string,
  content: string
): Promise<{ error?: string }> {
  const { universeId } = await requireUniverseEdit();

  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found." };

  await prisma.chapter.update({ where: { id: chapterId }, data: { content } });
  return {};
}

// Accepts an ordered array of chapter IDs and updates their order fields.
export async function reorderChapters(
  workId: string,
  orderedIds: string[]
): Promise<{ error?: string }> {
  const { universeId } = await requireUniverseEdit();

  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found." };

  await Promise.all(
    orderedIds.map((id, i) =>
      prisma.chapter.update({ where: { id }, data: { order: i } })
    )
  );

  revalidatePath(`/admin/works/${workId}/editor`);
  return {};
}
