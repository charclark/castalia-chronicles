"use server";

import { requireUniverseEdit } from "@/lib/auth-utils";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import sharp from "sharp";

export type FreeReadSubmissionState = { error?: string; success?: string } | null;

// ── Build a frozen content snapshot ──────────────────────────────────────────
// Called at approval time so the viewer always shows the approved content,
// even if the author later edits the underlying work/chapters.

async function snapshotContent(
  workId: string,
  submissionType: string,
  selectedChapterIds: string | null
): Promise<string> {
  type Section = { title: string | null; html: string };
  const sections: Section[] = [];

  if (submissionType === "full") {
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { content: true },
    });
    sections.push({ title: null, html: work?.content ?? "" });
  } else {
    let ids: string[] = [];
    try { ids = JSON.parse(selectedChapterIds ?? "[]") as string[]; } catch { /* ignore */ }
    if (ids.length > 0) {
      const chapters = await prisma.chapter.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true, content: true },
      });
      const map = new Map(chapters.map((c) => [c.id, c]));
      for (const cid of ids) {
        const ch = map.get(cid);
        if (ch) sections.push({ title: ch.title, html: ch.content ?? "" });
      }
    }
  }

  return JSON.stringify({ sections });
}

// ── Submit / resubmit ─────────────────────────────────────────────────────────

export async function submitFreeRead(
  _prev: FreeReadSubmissionState,
  formData: FormData
): Promise<FreeReadSubmissionState> {
  const { session, universeId } = await requireUniverseEdit();

  const workId = formData.get("workId") as string;
  if (!workId) return { error: "Work ID missing." };

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

  const keepCover = formData.get("keepCover") === "1";
  const existing = await prisma.freeReadSubmission.findUnique({ where: { workId } });

  // ── If the current submission is live (approved), stage edits instead of
  //    overwriting — the approved version stays visible until Char approves.
  if (existing && existing.status === "approved") {
    const pendingEdit = {
      submissionType,
      selectedChapterIds: submissionType === "chapters" ? JSON.stringify(selectedChapterIds) : null,
      title,
      description,
      contentRating,
      coverBgIndex: coverBgIndex ?? null,
      keepExistingCover: !coverImageData && (keepCover || !coverBgIndex),
    };

    const updateData: Record<string, unknown> = {
      pendingEdits: JSON.stringify(pendingEdit),
      rejectionNote: null,
    };
    if (coverImageData) {
      updateData.pendingCoverImageData = coverImageData;
    }

    await prisma.freeReadSubmission.update({ where: { workId }, data: updateData });

    revalidatePath(`/admin/works/${workId}`);
    revalidatePath("/admin/author-approvals");
    revalidatePath("/admin/my-publications");
    return { success: "edit_pending" };
  }

  // ── First submission or resubmission of a non-approved submission ─────────
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
    pendingEdits: null,
    pendingCoverImageData: null,
    contentSnapshot: null,
    rejectionNote: null,
    ...(coverImageData !== null ? { coverImageData } : {}),
  };

  if (existing) {
    await prisma.freeReadSubmission.update({
      where: { workId },
      data: {
        ...data,
        ...(keepCover && coverImageData === null ? {} : { coverImageData: coverImageData ?? null }),
      },
    });
  } else {
    await prisma.freeReadSubmission.create({
      data: { workId, ...data, coverImageData: coverImageData ?? null },
    });
  }

  revalidatePath(`/admin/works/${workId}`);
  revalidatePath("/admin/author-approvals");
  revalidatePath("/admin/my-publications");
  revalidatePath("/free-read");
  return { success: "submitted" };
}

// ── Withdraw a pending submission (author-initiated) ──────────────────────────

export async function withdrawFreeRead(workId: string): Promise<{ error?: string }> {
  const { universeId } = await requireUniverseEdit();

  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found." };

  await prisma.freeReadSubmission.deleteMany({
    where: { workId, status: "pending" },
  });

  revalidatePath(`/admin/works/${workId}`);
  revalidatePath("/admin/author-approvals");
  revalidatePath("/admin/my-publications");
  revalidatePath("/free-read");
  return {};
}

// ── Unpublish (author removes their own approved submission) ──────────────────

export async function unpublishFreeRead(workId: string): Promise<{ error?: string }> {
  const { universeId } = await requireUniverseEdit();

  const work = await prisma.work.findFirst({ where: { id: workId, universeId } });
  if (!work) return { error: "Work not found." };

  await prisma.freeReadSubmission.updateMany({
    where: { workId },
    data: { status: "rejected", reviewedAt: new Date(), pendingEdits: null, pendingCoverImageData: null },
  });

  revalidatePath(`/admin/works/${workId}`);
  revalidatePath("/admin/my-publications");
  revalidatePath("/free-read");
  return {};
}

// ── Superadmin: approve ───────────────────────────────────────────────────────

export async function approveFreeReadSubmission(id: string): Promise<void> {
  await requireSuperAdmin();

  const sub = await prisma.freeReadSubmission.findUnique({
    where: { id },
    select: {
      pendingEdits: true,
      pendingCoverImageData: true,
      publishedAt: true,
      workId: true,
      submissionType: true,
      selectedChapterIds: true,
    },
  });
  if (!sub) return;

  if (sub.pendingEdits) {
    // Approving an edit to an already-live submission: apply staged edits + snapshot new content
    type PendingEdit = {
      submissionType: string;
      selectedChapterIds: string | null;
      title: string;
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

    const contentSnapshot = await snapshotContent(
      sub.workId,
      edit.submissionType,
      edit.selectedChapterIds
    );

    await prisma.freeReadSubmission.update({
      where: { id },
      data: {
        submissionType: edit.submissionType,
        selectedChapterIds: edit.selectedChapterIds,
        title: edit.title,
        description: edit.description,
        contentRating: edit.contentRating,
        contentSnapshot,
        reviewedAt: new Date(),
        pendingEdits: null,
        pendingCoverImageData: null,
        rejectionNote: null,
        ...coverUpdate,
      },
    });
  } else {
    // Approving a new (first-time or resubmitted) submission — snapshot at approval time
    const contentSnapshot = await snapshotContent(
      sub.workId,
      sub.submissionType,
      sub.selectedChapterIds
    );

    await prisma.freeReadSubmission.update({
      where: { id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        publishedAt: sub.publishedAt ?? new Date(),
        contentSnapshot,
      },
    });
  }

  revalidatePath("/admin/author-approvals");
  revalidatePath("/admin/my-publications");
  revalidatePath("/free-read");
}

// ── Superadmin: reject ────────────────────────────────────────────────────────

export async function rejectFreeReadSubmission(id: string, rejectionNote?: string): Promise<void> {
  await requireSuperAdmin();

  const sub = await prisma.freeReadSubmission.findUnique({
    where: { id },
    select: { pendingEdits: true },
  });
  if (!sub) return;

  if (sub.pendingEdits) {
    await prisma.freeReadSubmission.update({
      where: { id },
      data: {
        pendingEdits: null,
        pendingCoverImageData: null,
        rejectionNote: rejectionNote ?? null,
      },
    });
  } else {
    await prisma.freeReadSubmission.update({
      where: { id },
      data: { status: "rejected", reviewedAt: new Date(), rejectionNote: rejectionNote ?? null },
    });
  }

  revalidatePath("/admin/author-approvals");
  revalidatePath("/admin/my-publications");
  revalidatePath("/free-read");
}

// ── Superadmin: dismiss ───────────────────────────────────────────────────────

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
    await prisma.freeReadLike.create({ data: { submissionId, ipAddress: ip } });
  } catch {
    // Unique constraint — already liked from this IP; silently ignore
  }

  const count = await prisma.freeReadLike.count({ where: { submissionId } });
  return { liked: true, count };
}
