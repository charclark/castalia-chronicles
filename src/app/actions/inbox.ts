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
