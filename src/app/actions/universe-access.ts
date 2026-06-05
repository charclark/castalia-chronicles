"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-utils";

export type AccessState = { error?: string; success?: string } | null;

export async function setUniversePrivacy(
  universeId: string,
  isPrivate: boolean
): Promise<{ error?: string }> {
  await requireSuperAdmin();
  const universe = await prisma.universe.findUnique({ where: { id: universeId } });
  if (!universe) return { error: "Universe not found." };

  await prisma.universe.update({ where: { id: universeId }, data: { isPrivate } });
  revalidatePath("/admin/universes");
  return {};
}

export async function grantUniverseAccess(
  universeId: string,
  userId: string,
  permission: "view" | "edit"
): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const universe = await prisma.universe.findUnique({ where: { id: universeId } });
  if (!universe) return { error: "Universe not found." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };
  if (user.isSuperAdmin) return { error: "Super-admin always has access." };

  await prisma.universeAccess.upsert({
    where: { universeId_userId: { universeId, userId } },
    update: { permission },
    create: { universeId, userId, permission },
  });

  revalidatePath("/admin/universes");
  return {};
}

export async function updateUniverseAccess(
  universeId: string,
  userId: string,
  permission: "view" | "edit"
): Promise<{ error?: string }> {
  await requireSuperAdmin();

  await prisma.universeAccess.update({
    where: { universeId_userId: { universeId, userId } },
    data: { permission },
  });

  revalidatePath("/admin/universes");
  return {};
}

export async function revokeUniverseAccess(
  universeId: string,
  userId: string
): Promise<{ error?: string }> {
  await requireSuperAdmin();

  await prisma.universeAccess.deleteMany({
    where: { universeId, userId },
  });

  revalidatePath("/admin/universes");
  return {};
}
