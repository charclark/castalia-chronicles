"use server";

import { redirect } from "next/navigation";
import { requireUniverseEdit } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type IdeaState = { error?: string; success?: string } | null;


export async function createStorylineIdea(
  _prev: IdeaState,
  formData: FormData
): Promise<IdeaState> {
  const { universeId } = await requireUniverseEdit();
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim() || null;

  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title must be 200 characters or less." };

  const idea = await prisma.storylineIdea.create({
    data: { universeId, title, content },
  });

  redirect(`/admin/storyline-ideas/${idea.id}`);
}

export async function updateStorylineIdea(
  _prev: IdeaState,
  formData: FormData
): Promise<IdeaState> {
  const { universeId } = await requireUniverseEdit();
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim() || null;

  if (!id) return { error: "ID missing." };
  if (!title) return { error: "Title is required." };

  const existing = await prisma.storylineIdea.findFirst({
    where: { id, universeId },
  });
  if (!existing) return { error: "Idea not found." };

  await prisma.storylineIdea.update({ where: { id }, data: { title, content } });
  revalidatePath("/admin/storyline-ideas/" + id);
  return { success: "Saved." };
}

export async function deleteStorylineIdea(id: string): Promise<void> {
  const { universeId } = await requireUniverseEdit();
  const existing = await prisma.storylineIdea.findFirst({
    where: { id, universeId },
  });
  if (!existing) return;
  await prisma.storylineIdea.delete({ where: { id } });
  revalidatePath("/admin");
  redirect("/admin");
}
