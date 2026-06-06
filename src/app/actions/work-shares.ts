"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUniverseEdit } from "@/lib/auth-utils";

// Grant a user comment/read-only access to a single work.
// Requires the caller to have edit access to the universe containing the work.
export async function createWorkShare(
  workId: string,
  userId: string
): Promise<{ error?: string }> {
  const { session, universeId } = await requireUniverseEdit();

  if (userId === session.userId) return { error: "You cannot share with yourself." };

  // Confirm the work belongs to the current universe
  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found in this universe." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  await prisma.workShare.upsert({
    where: { workId_userId: { workId, userId } },
    update: {},
    create: { workId, userId },
  });

  revalidatePath("/admin/works");
  return {};
}

export async function revokeWorkShare(
  workId: string,
  userId: string
): Promise<{ error?: string }> {
  const { universeId } = await requireUniverseEdit();

  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found in this universe." };

  await prisma.workShare.deleteMany({ where: { workId, userId } });
  revalidatePath("/admin/works");
  return {};
}
