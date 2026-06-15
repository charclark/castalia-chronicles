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

  await prisma.authorProfile.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      eyebrowText,
      headline,
      bodyText,
      status: "pending",
      submittedAt: new Date(),
    },
    update: {
      eyebrowText,
      headline,
      bodyText,
      status: "pending",
      submittedAt: new Date(),
    },
  });

  revalidatePath("/admin/author-profile");
  revalidatePath("/our-authors");
  return { success: "Profile sent to SuperAdmin Char for approval. Stay tuned..." };
}

export async function saveAuthorPhoto(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireAuth();

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "No photo provided." };
  if (file.size > 8 * 1024 * 1024) return { error: "File too large (max 8 MB)." };

  const arrayBuffer = await file.arrayBuffer();
  const photoData = Buffer.from(arrayBuffer);

  await prisma.authorProfile.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      photoData,
      status: "pending",
      submittedAt: new Date(),
    },
    update: { photoData },
  });

  revalidatePath("/admin/author-profile");
  revalidatePath("/our-authors");
  return {};
}

export async function removeAuthorPhoto(): Promise<{ error?: string }> {
  const session = await requireAuth();

  await prisma.authorProfile.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, photoData: null, status: "pending", submittedAt: new Date() },
    update: { photoData: null },
  });

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
