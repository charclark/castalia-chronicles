"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type AboutState = { error?: string; success?: string } | null;

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
  if (!session.isSuperAdmin) throw new Error("Not authorized.");
}

export async function updateAboutContent(
  _prev: AboutState,
  formData: FormData
): Promise<AboutState> {
  await requireSuperAdmin();

  const eyebrow = (formData.get("eyebrow") as string | null)?.trim() || null;
  const headline = (formData.get("headline") as string | null)?.trim() || null;
  const bio = (formData.get("bio") as string | null)?.trim() || null;

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", eyebrow, headline, bio },
    update: { eyebrow, headline, bio },
  });

  revalidatePath("/about");
  revalidatePath("/admin/about");
  return { success: "Content saved." };
}

// Called from the client after compressing the image client-side.
// Receives FormData with a "photo" File entry (compressed JPEG).
export async function updateAboutPhoto(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "No photo provided." };
  if (file.size > 8 * 1024 * 1024) return { error: "File too large (max 8 MB)." };

  const arrayBuffer = await file.arrayBuffer();
  const photoData = Buffer.from(arrayBuffer);

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", photoData },
    update: { photoData },
  });

  revalidatePath("/about");
  revalidatePath("/admin/about");
  return {};
}

export async function removeAboutPhoto(): Promise<{ error?: string }> {
  await requireSuperAdmin();

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", photoData: null },
    update: { photoData: null },
  });

  revalidatePath("/about");
  revalidatePath("/admin/about");
  return {};
}
