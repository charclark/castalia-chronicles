"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUniverseEdit } from "@/lib/auth-utils";
import { requireSuperAdmin } from "@/lib/auth-utils";
import sharp from "sharp";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function submitDiscoverBooks(
  _prev: { error?: string; success?: boolean | string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean | string }> {
  const { session } = await requireUniverseEdit();
  const userId = session.userId;

  const workId = formData.get("workId") as string;
  const bookTitle = (formData.get("bookTitle") as string ?? "").trim();
  const authorName = (formData.get("authorName") as string ?? "").trim();
  const purchaseUrl = (formData.get("purchaseUrl") as string ?? "").trim();
  const purchaseLinkText = (formData.get("purchaseLinkText") as string ?? "").trim();
  const description = (formData.get("description") as string ?? "").trim();
  const contentRating = formData.get("contentRating") as string;
  const coverBgIndexRaw = formData.get("coverBgIndex") as string | null;
  const coverFile = formData.get("coverFile") as File | null;
  const keepCover = formData.get("keepCover") === "1";

  if (!bookTitle) return { error: "Book title is required." };
  if (!authorName) return { error: "Author name is required." };
  if (!purchaseUrl) return { error: "Purchase URL is required." };
  if (!purchaseLinkText) return { error: "Purchase link display text is required." };
  if (!description) return { error: "Description is required." };
  if (!contentRating) return { error: "Content rating is required." };
  if (countWords(description) > 100) return { error: "Description must be 100 words or fewer." };
  try { new URL(purchaseUrl); } catch { return { error: "Purchase URL must be a valid URL (include https://)." }; }

  let coverImageData: Uint8Array<ArrayBuffer> | undefined = undefined;
  let coverBgIndex: number | null = null;

  if (coverFile && coverFile.size > 0) {
    const buf = Buffer.from(await coverFile.arrayBuffer());
    const compressed = await sharp(buf)
      .resize(800, 1200, { fit: "cover" })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    coverImageData = new Uint8Array(compressed) as Uint8Array<ArrayBuffer>;
    coverBgIndex = null;
  } else if (coverBgIndexRaw) {
    const idx = parseInt(coverBgIndexRaw, 10);
    if (idx >= 1 && idx <= 10) coverBgIndex = idx;
  }

  const work = await prisma.work.findFirst({
    where: { id: workId },
    select: { id: true, universeId: true },
  });
  if (!work) return { error: "Work not found." };

  const existing = await prisma.discoverBooksSubmission.findUnique({
    where: { workId },
    select: { id: true, coverImageData: true, status: true },
  });

  // ── If currently live (approved), stage the edit — don't overwrite the
  //    live version. It stays visible until Char approves the edit.
  if (existing && existing.status === "approved") {
    const pendingEdit = {
      bookTitle,
      authorName,
      purchaseUrl,
      purchaseLinkText,
      description,
      contentRating,
      coverBgIndex,
      keepExistingCover: !coverImageData && (keepCover || !coverBgIndex),
    };

    const updateData: Record<string, unknown> = {
      pendingEdits: JSON.stringify(pendingEdit),
      rejectionNote: null,
    };
    if (coverImageData) {
      updateData.pendingCoverImageData = coverImageData;
    }

    await prisma.discoverBooksSubmission.update({
      where: { workId },
      data: updateData,
    });

    revalidatePath(`/admin/works/${workId}`);
    revalidatePath("/admin/author-approvals");
    revalidatePath("/admin/my-publications");
    return { success: "edit_pending" };
  }

  // ── First submission or resubmission of a non-approved submission ─────────
  const coverDataForWrite: Uint8Array<ArrayBuffer> | null | undefined =
    coverImageData !== undefined
      ? coverImageData
      : keepCover && existing?.coverImageData
      ? undefined // don't touch — prisma undefined skips the field
      : null;

  const baseData = {
    userId,
    bookTitle,
    authorName,
    purchaseUrl,
    purchaseLinkText,
    description,
    contentRating,
    coverBgIndex,
    status: "pending",
    submittedAt: new Date(),
    reviewedAt: null,
    publishedAt: null,
    pendingEdits: null,
    pendingCoverImageData: null,
    rejectionNote: null,
  };

  if (existing) {
    await prisma.discoverBooksSubmission.update({
      where: { workId },
      data: {
        ...baseData,
        ...(coverDataForWrite !== undefined ? { coverImageData: coverDataForWrite } : {}),
      },
    });
  } else {
    await prisma.discoverBooksSubmission.create({
      data: {
        workId,
        ...baseData,
        coverImageData: coverImageData ?? null as unknown as Uint8Array<ArrayBuffer> | null,
      },
    });
  }

  revalidatePath(`/admin/works/${workId}`);
  revalidatePath("/admin/author-approvals");
  revalidatePath("/admin/my-publications");
  revalidatePath("/books");
  return { success: true };
}

export async function unpublishDiscoverBooks(workId: string): Promise<void> {
  await requireUniverseEdit();
  await prisma.discoverBooksSubmission.update({
    where: { workId },
    data: { status: "rejected", reviewedAt: new Date(), pendingEdits: null, pendingCoverImageData: null },
  });
  revalidatePath(`/admin/works/${workId}`);
  revalidatePath("/admin/my-publications");
  revalidatePath("/books");
}

export async function approveDiscoverBooksSubmission(id: string): Promise<void> {
  await requireSuperAdmin();

  const sub = await prisma.discoverBooksSubmission.findUnique({
    where: { id },
    select: { pendingEdits: true, pendingCoverImageData: true, publishedAt: true },
  });
  if (!sub) return;

  if (sub.pendingEdits) {
    // Approving an edit to a live listing: apply staged edits
    type PendingEdit = {
      bookTitle: string;
      authorName: string;
      purchaseUrl: string;
      purchaseLinkText: string;
      description: string;
      contentRating: string;
      coverBgIndex: number | null;
      keepExistingCover: boolean;
    };
    const edit = JSON.parse(sub.pendingEdits) as PendingEdit;

    const coverUpdate: Record<string, unknown> = {};
    if (sub.pendingCoverImageData) {
      coverUpdate.coverImageData = sub.pendingCoverImageData;
      coverUpdate.coverBgIndex = null;
    } else if (!edit.keepExistingCover && edit.coverBgIndex !== null) {
      coverUpdate.coverBgIndex = edit.coverBgIndex;
      coverUpdate.coverImageData = null;
    }

    await prisma.discoverBooksSubmission.update({
      where: { id },
      data: {
        bookTitle: edit.bookTitle,
        authorName: edit.authorName,
        purchaseUrl: edit.purchaseUrl,
        purchaseLinkText: edit.purchaseLinkText,
        description: edit.description,
        contentRating: edit.contentRating,
        reviewedAt: new Date(),
        pendingEdits: null,
        pendingCoverImageData: null,
        rejectionNote: null,
        ...coverUpdate,
      },
    });
  } else {
    // Approving a new submission
    await prisma.discoverBooksSubmission.update({
      where: { id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        publishedAt: sub.publishedAt ?? new Date(),
      },
    });
  }

  revalidatePath("/books");
  revalidatePath("/admin/author-approvals");
  revalidatePath("/admin/my-publications");
}

export async function rejectDiscoverBooksSubmission(id: string, rejectionNote?: string): Promise<void> {
  await requireSuperAdmin();

  const sub = await prisma.discoverBooksSubmission.findUnique({
    where: { id },
    select: { pendingEdits: true },
  });
  if (!sub) return;

  if (sub.pendingEdits) {
    // Rejecting an edit: clear staged edits, keep the live listing intact
    await prisma.discoverBooksSubmission.update({
      where: { id },
      data: {
        pendingEdits: null,
        pendingCoverImageData: null,
        rejectionNote: rejectionNote ?? null,
      },
    });
  } else {
    // Rejecting a new submission
    await prisma.discoverBooksSubmission.update({
      where: { id },
      data: { status: "rejected", reviewedAt: new Date(), rejectionNote: rejectionNote ?? null },
    });
  }

  revalidatePath("/admin/author-approvals");
  revalidatePath("/admin/my-publications");
  revalidatePath("/books");
}

export async function dismissDiscoverBooksSubmission(id: string): Promise<void> {
  await requireSuperAdmin();
  await prisma.discoverBooksSubmission.delete({ where: { id } });
  revalidatePath("/admin/author-approvals");
  revalidatePath("/books");
}

export async function likeDiscoverBooks(
  submissionId: string
): Promise<{ liked: boolean; count: number }> {
  const sub = await prisma.discoverBooksSubmission.findUnique({
    where: { id: submissionId, status: "approved" },
    select: { id: true },
  });
  if (!sub) return { liked: false, count: 0 };

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  try {
    await prisma.discoverBooksLike.create({
      data: { submissionId, ipAddress: ip },
    });
  } catch {
    // Already liked from this IP
  }

  const count = await prisma.discoverBooksLike.count({ where: { submissionId } });
  return { liked: true, count };
}
