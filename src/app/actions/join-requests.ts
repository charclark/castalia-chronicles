"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type State = { error?: string; success?: boolean } | null;

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session?.isSuperAdmin) throw new Error("Not authorized.");
}

export async function submitJoinRequest(
  _prev: State,
  formData: FormData
): Promise<State> {
  const get = (k: string) => (formData.get(k) as string | null)?.trim() ?? "";

  const fullName          = get("fullName");
  const email             = get("email");
  const requestedUsername = get("requestedUsername");
  const genres            = get("genres");
  const aboutYou          = get("aboutYou");
  const existingWorkLink  = get("existingWorkLink") || null;
  const howDidYouHear     = get("howDidYouHear") || null;

  const confirmedAge           = formData.get("confirmedAge") === "on";
  const confirmedOriginalAuthor = formData.get("confirmedOriginalAuthor") === "on";
  const confirmedPlagiarism    = formData.get("confirmedPlagiarism") === "on";
  const confirmedApproval      = formData.get("confirmedApproval") === "on";
  const confirmedPersonalUse   = formData.get("confirmedPersonalUse") === "on";
  const confirmedRightToRefuse = formData.get("confirmedRightToRefuse") === "on";
  const confirmedTerms         = formData.get("confirmedTerms") === "on";

  // Basic validation
  if (!fullName)          return { error: "Full name is required." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                          return { error: "A valid email address is required." };
  if (!requestedUsername || requestedUsername.length < 2)
                          return { error: "A requested username is required (min 2 characters)." };
  if (!/^[a-zA-Z0-9_-]+$/.test(requestedUsername))
                          return { error: "Username may only contain letters, numbers, hyphens, and underscores." };
  if (!genres)            return { error: "Please select at least one genre." };
  if (!aboutYou)          return { error: "Please tell us about you and your writing." };
  if (!confirmedAge || !confirmedOriginalAuthor || !confirmedPlagiarism ||
      !confirmedApproval || !confirmedPersonalUse || !confirmedRightToRefuse || !confirmedTerms)
                          return { error: "All checkboxes must be confirmed before submitting." };

  // Check username not already taken
  try {
    const existing = await prisma.user.findFirst({
      where: { username: { equals: requestedUsername, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) return { error: "That username is already taken. Please choose another." };
  } catch {
    return { error: "Unable to verify username availability. Please try again." };
  }

  // Capture IP
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  try {
    await prisma.joinRequest.create({
      data: {
        fullName,
        email,
        requestedUsername,
        genres,
        aboutYou,
        existingWorkLink,
        howDidYouHear,
        confirmedAge,
        confirmedOriginalAuthor,
        confirmedPlagiarism,
        confirmedApproval,
        confirmedPersonalUse,
        confirmedRightToRefuse,
        confirmedTerms,
        termsVersion: "June 2026",
        ipAddress: ip,
      },
    });
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin/author-approvals");
  return { success: true };
}

export async function approveJoinRequest(id: string): Promise<void> {
  await requireSuperAdmin();
  await prisma.joinRequest.update({
    where: { id },
    data: { status: "approved", reviewedAt: new Date() },
  });
  revalidatePath("/admin/author-approvals");
}

export async function rejectJoinRequest(id: string, rejectionNote?: string): Promise<void> {
  await requireSuperAdmin();
  await prisma.joinRequest.update({
    where: { id },
    data: { status: "rejected", reviewedAt: new Date(), rejectionNote: rejectionNote ?? null },
  });
  revalidatePath("/admin/author-approvals");
}

export async function dismissJoinRequest(id: string): Promise<void> {
  await requireSuperAdmin();
  await prisma.joinRequest.delete({ where: { id } });
  revalidatePath("/admin/author-approvals");
}
