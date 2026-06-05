"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function auth() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
}

export async function markFeedbackRead(id: string, read: boolean): Promise<void> {
  await auth();
  await prisma.feedbackMessage.update({ where: { id }, data: { read } });
  revalidatePath("/admin/feedback");
}

export async function deleteFeedbackMessage(id: string): Promise<void> {
  await auth();
  await prisma.feedbackMessage.delete({ where: { id } });
  revalidatePath("/admin/feedback");
}

export async function deleteMailingListEntry(id: string): Promise<void> {
  await auth();
  await prisma.mailingListEntry.delete({ where: { id } });
  revalidatePath("/admin/mailing-list");
}

export type MailingListState = { error?: string; success?: string } | null;

export async function addMailingListEntry(
  _prev: MailingListState,
  formData: FormData
): Promise<MailingListState> {
  await auth();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = (formData.get("name") as string)?.trim() || null;

  if (!email) return { error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Please enter a valid email address." };

  const existing = await prisma.mailingListEntry.findUnique({ where: { email } });
  if (existing) return { error: "That email is already on the list." };

  await prisma.mailingListEntry.create({ data: { email, name } });
  revalidatePath("/admin/mailing-list");
  return { success: `${email} added to the mailing list.` };
}
