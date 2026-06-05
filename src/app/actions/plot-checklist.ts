"use server";

import { requireUniverseEdit } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type PlotState = { error?: string } | null;


export async function createPlotItem(
  _prev: PlotState,
  formData: FormData
): Promise<PlotState> {
  const { universeId } = await requireUniverseEdit();
  const text = (formData.get("text") as string)?.trim();
  if (!text) return { error: "Item text is required." };
  if (text.length > 500) return { error: "Item must be 500 characters or less." };

  await prisma.plotItem.create({ data: { universeId, text } });
  revalidatePath("/admin/plot-checklist");
  revalidatePath("/admin", "layout");
  return null;
}

export async function togglePlotItem(id: string, checked: boolean): Promise<void> {
  const { universeId } = await requireUniverseEdit();
  const existing = await prisma.plotItem.findFirst({ where: { id, universeId } });
  if (!existing) return;
  await prisma.plotItem.update({ where: { id }, data: { checked } });
  revalidatePath("/admin/plot-checklist");
  revalidatePath("/admin", "layout");
}

export async function deletePlotItem(id: string): Promise<void> {
  const { universeId } = await requireUniverseEdit();
  const existing = await prisma.plotItem.findFirst({ where: { id, universeId } });
  if (!existing) return;
  await prisma.plotItem.delete({ where: { id } });
  revalidatePath("/admin/plot-checklist");
  revalidatePath("/admin", "layout");
}
