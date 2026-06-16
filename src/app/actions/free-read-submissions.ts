"use server";

import { requireUniverseEdit } from "@/lib/auth-utils";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import sharp from "sharp";

export type FreeReadSubmissionState = { error?: string; success?: string } | null;

// ── Submit / resubmit ─────────────────────────────────────────────────────────

export async function submitFreeRead(
  _prev: FreeReadSubmissionState,
  formData: FormData
): Promise<FreeReadSubmissionState> {
  const { session, universeId } = await requireUniverseEdit();

  const workId = formData.get("workId") as string;
  if (!workId) return { error: "Work ID missing." };

  // Verify work belongs to this universe
  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found." };

  const submissionType = formData.get("submissionType") as "chapters" | "full";
  if (submissionType !== "chapters" && submissionType !== "full")
    return { error: "Invalid submission type." };

  const selectedChapterIds: string[] = formData.getAll("selectedChapterIds[]") as string[];
  if (submissionType === "chapters" && selectedChapterIds.length === 0)
    return { error: "Select at least one chapter." };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required." };

  const description = (formData.get("description") as string)?.trim();
  if (!description) return { error: "Description is required." };

  const wordCount = description.split(/\s+/).filter(Boolean).length;
  if (wordCount > 100) return { error: `Description must be 100 words or fewer (currently ${wordCount}).` };

  const contentRating = formData.get("contentRating") as string;
  const validRatings = ["General", "Teen", "Mature Themes", "Adult"];
  if (!validRatings.includes(contentRating)) return { error: "Invalid content rating." };

  const coverBgIndexRaw = formData.get("coverBgIndex") as string | null;
  const coverBgIndex = coverBgIndexRaw ? parseInt(coverBgIndexRaw, 10) : null;
  if (coverBgIndex !== null && (coverBgIndex < 1 || coverBgIndex > 10))
    return { error: "Invalid background index." };

  // Cover image upload — compress via Sharp
  let coverImageData: Uint8Array<ArrayBuffer> | null = null;
  const coverFile = formData.get("coverImage") as File | null;
  if (coverFile && coverFile.size > 0) {
    try {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const compressed = await sharp(buffer)
        .resize(800, 1200, { fit: "cover", position: "centre" })
        .jpeg({ quality: 75, mozjpeg: true })
        .toBuffer();
      coverImageData = new Uint8Array(compressed) as Uint8Array<ArrayBuffer>;
    } catch {
      return { error: "Failed to process cover image. Please try a different file." };
    }
  }

  const data = {
    userId: session.userId,
    submissionType,
    selectedChapterIds: submissionType === "chapters" ? JSON.stringify(selectedChapterIds) : null,
    title,
    description,
    contentRating,
    coverBgIndex: coverBgIndex ?? null,
    status: "pending",
    submittedAt: new Date(),
    reviewedAt: null,
    publishedAt: null,
    ...(coverImageData !== null ? { coverImageData } : {}),
    // If re-uploading without a new file, keep existing image — handled via keepCover flag
  };

  const keepCover = formData.get("keepCover") === "1";

  const existing = await prisma.freeReadSubmission.findUnique({ where: { workId } });

  if (existing) {
    // Resubmit — update but preserve coverImageData if no new file uploaded and keepCover=true
    await prisma.freeReadSubmission.update({
      where: { workId },
      data: {
        ...data,
        ...(keepCover && coverImageData === null
          ? {} // preserve existing image
          : { coverImageData: coverImageData ?? null }),
      },
    });
  } else {
    await prisma.freeReadSubmission.create({
      data: {
        workId,
        ...data,
        coverImageData: coverImageData ?? null,
      },
    });
  }

  revalidatePath(`/admin/works/${workId}`);
  revalidatePath("/admin/author-approvals");
  revalidatePath("/free-read");
  return { success: "submitted" };
}

// ── Unpublish (author removes their own approved submission) ──────────────────

export async function unpublishFreeRead(workId: string): Promise<{ error?: string }> {
  const { universeId } = await requireUniverseEdit();

  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found." };

  await prisma.freeReadSubmission.updateMany({
    where: { workId },
    data: { status: "rejected", reviewedAt: new Date() },
  });

  revalidatePath(`/admin/works/${workId}`);
  revalidatePath("/free-read");
  return {};
}

// ── Superadmin: approve / reject ─────────────────────────────────────────────

export async function approveFreeReadSubmission(id: string): Promise<void> {
  await requireSuperAdmin();
  await prisma.freeReadSubmission.update({
    where: { id },
    data: { status: "approved", reviewedAt: new Date(), publishedAt: new Date() },
  });
  revalidatePath("/admin/author-approvals");
  revalidatePath("/free-read");
}

export async function rejectFreeReadSubmission(id: string, rejectionNote?: string): Promise<void> {
  await requireSuperAdmin();
  await prisma.freeReadSubmission.update({
    where: { id },
    data: { status: "rejected", reviewedAt: new Date(), rejectionNote: rejectionNote ?? null },
  });
  revalidatePath("/admin/author-approvals");
  revalidatePath("/free-read");
}

export async function dismissFreeReadSubmission(id: string): Promise<void> {
  await requireSuperAdmin();
  await prisma.freeReadSubmission.delete({ where: { id } });
  revalidatePath("/admin/author-approvals");
  revalidatePath("/free-read");
}

// ── Public: like a submission ─────────────────────────────────────────────────

export async function likeFreeRead(
  submissionId: string
): Promise<{ liked: boolean; count: number }> {
  const sub = await prisma.freeReadSubmission.findUnique({
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
    await prisma.freeReadLike.create({
      data: { submissionId, ipAddress: ip },
    });
  } catch {
    // Unique constraint — already liked from this IP; silently ignore
  }

  const count = await prisma.freeReadLike.count({ where: { submissionId } });
  return { liked: true, count };
}
