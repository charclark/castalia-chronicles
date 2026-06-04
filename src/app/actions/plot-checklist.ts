"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentUniverseId } from "@/lib/universe";

export type PlotState = { error?: string } | null;

async function auth() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
}

export async function createPlotItem(
  _prev: PlotState,
  formData: FormData
): Promise<PlotState> {
  await auth();
  const universeId = await getCurrentUniverseId();
  const text = (formData.get("text") as string)?.trim();
  if (!text) return { error: "Item text is required." };
  if (text.length > 500) return { error: "Item must be 500 characters or less." };

  await prisma.plotItem.create({ data: { universeId, text } });
  revalidatePath("/admin/plot-checklist");
  revalidatePath("/admin", "layout");
  return null;
}

export async function togglePlotItem(id: string, checked: boolean): Promise<void> {
  await auth();
  const universeId = await getCurrentUniverseId();
  const existing = await prisma.plotItem.findFirst({ where: { id, universeId } });
  if (!existing) return;
  await prisma.plotItem.update({ where: { id }, data: { checked } });
  revalidatePath("/admin/plot-checklist");
  revalidatePath("/admin", "layout");
}

export async function deletePlotItem(id: string): Promise<void> {
  await auth();
  const universeId = await getCurrentUniverseId();
  const existing = await prisma.plotItem.findFirst({ where: { id, universeId } });
  if (!existing) return;
  await prisma.plotItem.delete({ where: { id } });
  revalidatePath("/admin/plot-checklist");
  revalidatePath("/admin", "layout");
}
