"use server";

import { prisma } from "@/lib/prisma";

export async function getFlags(workId: string) {
  return prisma.flag.findMany({
    where: { workId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createFlag(
  workId: string,
  chapterId: string,
  color: string,
  fromOffset: number,
  toOffset: number,
  snippet: string
) {
  try {
    const flag = await prisma.flag.create({
      data: { workId, chapterId, color, fromOffset, toOffset, snippet },
    });
    return { flag };
  } catch {
    return { error: "Failed to create flag" };
  }
}

export async function deleteFlag(id: string, workId: string) {
  try {
    await prisma.flag.delete({ where: { id, workId } });
    return { ok: true };
  } catch {
    return { error: "Failed to delete flag" };
  }
}
