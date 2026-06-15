"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type ProfileState = { error?: string; success?: string } | null;

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
  return session;
}

async function requireSuperAdmin() {
  const session = await requireAuth();
  if (!session.isSuperAdmin) throw new Error("Not authorized.");
  return session;
}

export async function saveAuthorProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await requireAuth();

  const eyebrowText = (formData.get("eyebrowText") as string | null)?.trim() || null;
  const headline = (formData.get("headline") as string | null)?.trim() || null;
  const bodyText = (formData.get("bodyText") as string | null)?.trim() || null;

  const photoFile = formData.get("photo") as File | null;
  let photoData: Uint8Array<ArrayBuffer> | undefined;
  if (photoFile && photoFile.size > 0) {
    if (photoFile.size > 8 * 1024 * 1024) return { error: "Photo too large (max 8 MB)." };
    photoData = new Uint8Array(await photoFile.arrayBuffer()) as Uint8Array<ArrayBuffer>;
  }

  const sharedData = {
    eyebrowText,
    headline,
    bodyText,
    status: "pending",
    submittedAt: new Date(),
    ...(photoData !== undefined ? { photoData } : {}),
  };

  await prisma.authorProfile.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, ...sharedData },
    update: sharedData,
  });

  revalidatePath("/admin/author-profile");
  revalidatePath("/our-authors");
  return { success: "Profile sent to SuperAdmin Char for approval. Stay tuned..." };
}

export async function removeAuthorPhoto(): Promise<{ error?: string }> {
  const session = await requireAuth();

  try {
    await prisma.authorProfile.update({
      where: { userId: session.userId },
      data: { photoData: null },
    });
  } catch {
    return { error: "No profile found." };
  }

  revalidatePath("/admin/author-profile");
  revalidatePath("/our-authors");
  return {};
}

export async function deleteAuthorProfile(): Promise<{ error?: string }> {
  const session = await requireAuth();

  try {
    await prisma.authorProfile.delete({ where: { userId: session.userId } });
  } catch {
    return { error: "No profile found." };
  }

  revalidatePath("/admin/author-profile");
  revalidatePath("/our-authors");
  return {};
}

export async function approveAuthorProfile(id: string): Promise<void> {
  await requireSuperAdmin();
  await prisma.authorProfile.update({
    where: { id },
    data: { status: "approved", approvedAt: new Date() },
  });
  revalidatePath("/admin/author-approvals");
  revalidatePath("/our-authors");
}

export async function rejectAuthorProfile(id: string): Promise<void> {
  await requireSuperAdmin();
  await prisma.authorProfile.update({
    where: { id },
    data: { status: "rejected", approvedAt: null },
  });
  revalidatePath("/admin/author-approvals");
  revalidatePath("/our-authors");
}
