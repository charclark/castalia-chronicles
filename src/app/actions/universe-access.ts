"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, requireUniverseEdit } from "@/lib/auth-utils";

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

// ── Owner-initiated sharing (no superadmin required) ──────────────────────────
// Any user with edit access to the currently selected universe can share it.

export async function shareUniverseAsOwner(
  universeId: string,
  userId: string,
  permission: "view" | "edit"
): Promise<{ error?: string }> {
  const { session } = await requireUniverseEdit();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };
  if (userId === session.userId) return { error: "You cannot share with yourself." };

  await prisma.universeAccess.upsert({
    where: { universeId_userId: { universeId, userId } },
    update: { permission },
    create: { universeId, userId, permission },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/universes");
  return {};
}

export async function revokeUniverseShareAsOwner(
  universeId: string,
  userId: string
): Promise<{ error?: string }> {
  await requireUniverseEdit();

  await prisma.universeAccess.deleteMany({ where: { universeId, userId } });
  revalidatePath("/admin");
  revalidatePath("/admin/universes");
  return {};
}
