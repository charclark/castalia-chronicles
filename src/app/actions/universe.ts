"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type UniverseState = {
  error?: string;
  success?: string;
} | null;

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
  return session;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function createUniverse(
  _prev: UniverseState,
  formData: FormData
): Promise<UniverseState> {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Universe name is required." };
  if (name.length > 100) return { error: "Name must be 100 characters or less." };

  const universe = await prisma.universe.create({
    data: { name, description: (formData.get("description") as string)?.trim() || null },
  });

  // Auto-select the newly created universe
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
  await requireAuth();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!id) return { error: "Universe ID missing." };
  if (!name) return { error: "Name cannot be empty." };
  if (name.length > 100) return { error: "Name must be 100 characters or less." };

  const existing = await prisma.universe.findUnique({ where: { id } });
  if (!existing) return { error: "Universe not found." };

  await prisma.universe.update({ where: { id }, data: { name } });

  revalidatePath("/admin");
  revalidatePath("/admin/universes");
  return { success: `Renamed to "${name}".` };
}

export async function deleteUniverse(id: string): Promise<{ error?: string }> {
  await requireAuth();
  if (!id) return { error: "Universe ID missing." };

  const existing = await prisma.universe.findUnique({ where: { id } });
  if (!existing) return { error: "Universe not found." };

  await prisma.universe.delete({ where: { id } });

  // If the deleted universe was selected, clear the selection
  const cookieStore = await cookies();
  const selected = cookieStore.get("selected-universe")?.value;
  if (selected === id) {
    cookieStore.delete("selected-universe");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/universes");
  return {};
}

export async function switchUniverse(id: string): Promise<void> {
  await requireAuth();
  const cookieStore = await cookies();
  cookieStore.set("selected-universe", id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/admin", "layout");
}
