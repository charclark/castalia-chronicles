"use server";

import { redirect } from "next/navigation";
import { requireUniverseEdit } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type NoteState = { error?: string; success?: string } | null;


export async function createNote(
  _prev: NoteState,
  formData: FormData
): Promise<NoteState> {
  const { universeId } = await requireUniverseEdit();
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim() || null;

  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title must be 200 characters or less." };

  const note = await prisma.note.create({ data: { universeId, title, content } });
  redirect(`/admin/notes/${note.id}`);
}

export async function updateNote(
  _prev: NoteState,
  formData: FormData
): Promise<NoteState> {
  const { universeId } = await requireUniverseEdit();
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim() || null;

  if (!id) return { error: "ID missing." };
  if (!title) return { error: "Title is required." };

  const existing = await prisma.note.findFirst({ where: { id, universeId } });
  if (!existing) return { error: "Note not found." };

  await prisma.note.update({ where: { id }, data: { title, content } });
  revalidatePath("/admin/notes/" + id);
  return { success: "Saved." };
}

export async function deleteNote(id: string): Promise<void> {
  const { universeId } = await requireUniverseEdit();
  const existing = await prisma.note.findFirst({ where: { id, universeId } });
  if (!existing) return;
  await prisma.note.delete({ where: { id } });
  revalidatePath("/admin");
  redirect("/admin");
}
