"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type AboutState = { error?: string; success?: string } | null;

async function auth() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
}

export async function updateAboutBio(
  _prev: AboutState,
  formData: FormData
): Promise<AboutState> {
  await auth();
  const bio = (formData.get("bio") as string | null) ?? null;

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", bio: bio?.trim() || null },
    update: { bio: bio?.trim() || null },
  });

  revalidatePath("/about");
  revalidatePath("/admin/about");
  return { success: "Bio saved." };
}

// Called from the client after compressing the image client-side.
// Receives FormData with a "photo" File entry (compressed JPEG).
export async function updateAboutPhoto(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await auth();

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
  await auth();

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", photoData: null },
    update: { photoData: null },
  });

  revalidatePath("/about");
  revalidatePath("/admin/about");
  return {};
}
