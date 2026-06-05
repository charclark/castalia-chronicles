"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, requireAuth as authCheck } from "@/lib/auth-utils";

export type UniverseState = {
  error?: string;
  success?: string;
} | null;

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function createUniverse(
  _prev: UniverseState,
  formData: FormData
): Promise<UniverseState> {
  const session = await authCheck();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Universe name is required." };
  if (name.length > 100) return { error: "Name must be 100 characters or less." };

  const universe = await prisma.universe.create({
    data: {
      name,
      description: (formData.get("description") as string)?.trim() || null,
      createdByUserId: session.userId,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("selected-universe", universe.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/universes");
  return { success: `"${universe.name}" created.` };
}

export async function renameUniverse(
  _prev: UniverseState,
  formData: FormData
): Promise<UniverseState> {
  const session = await authCheck();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!id) return { error: "Universe ID missing." };
  if (!name) return { error: "Name cannot be empty." };
  if (name.length > 100) return { error: "Name must be 100 characters or less." };

  const existing = await prisma.universe.findUnique({ where: { id } });
  if (!existing) return { error: "Universe not found." };

  // Only the creator or super-admin can rename
  if (!session.isSuperAdmin && existing.createdByUserId !== session.userId) {
    return { error: "Access denied." };
  }

  await prisma.universe.update({ where: { id }, data: { name } });

  revalidatePath("/admin");
  revalidatePath("/admin/universes");
  return { success: `Renamed to "${name}".` };
}

// Owner delete: super-admin permanently deletes; regular user archives.
export async function deleteUniverse(id: string): Promise<{ error?: string }> {
  const session = await authCheck();
  if (!id) return { error: "Universe ID missing." };

  const universe = await prisma.universe.findUnique({
    where: { id },
    select: { createdByUserId: true, archivedAt: true },
  });
  if (!universe) return { error: "Universe not found." };
  if (universe.archivedAt) return { error: "Universe is already archived." };

  const isOwner = universe.createdByUserId === session.userId;
  if (!isOwner && !session.isSuperAdmin) return { error: "Access denied." };

  const cookieStore = await cookies();
  const selected = cookieStore.get("selected-universe")?.value;

  if (session.isSuperAdmin) {
    // Char: permanent delete
    await prisma.universe.delete({ where: { id } });
    if (selected === id) cookieStore.delete("selected-universe");
  } else {
    // Regular user: archive (hidden from everyone except Char)
    await prisma.universe.update({
      where: { id },
      data: { archivedAt: new Date(), archivedByUserId: session.userId },
    });
    if (selected === id) cookieStore.delete("selected-universe");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/universes");
  return {};
}

// Char-only: permanently delete an archived universe
export async function permanentDeleteArchivedUniverse(
  id: string
): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const universe = await prisma.universe.findUnique({
    where: { id },
    select: { archivedAt: true },
  });
  if (!universe) return { error: "Universe not found." };
  if (!universe.archivedAt) return { error: "Universe is not archived." };

  await prisma.universe.delete({ where: { id } });

  revalidatePath("/admin/universes");
  return {};
}

// Char-only: restore an archived universe (clears archive state)
export async function restoreUniverse(
  id: string
): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const universe = await prisma.universe.findUnique({
    where: { id },
    select: { archivedAt: true },
  });
  if (!universe) return { error: "Universe not found." };
  if (!universe.archivedAt) return { error: "Universe is not archived." };

  await prisma.universe.update({
    where: { id },
    data: { archivedAt: null, archivedByUserId: null },
  });

  revalidatePath("/admin/universes");
  return {};
}

export async function switchUniverse(id: string): Promise<void> {
  await authCheck();
  const cookieStore = await cookies();
  cookieStore.set("selected-universe", id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/admin", "layout");
}
