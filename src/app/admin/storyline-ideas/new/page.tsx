import { redirect } from "next/navigation";
import { getCanEditUniverse, requireUniverseEdit } from "@/lib/auth-utils";
import { getCurrentUniverseId } from "@/lib/universe";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import EntryEditor from "@/components/EntryEditor";

type IdeaState = { error?: string; success?: string } | null;

export default async function NewStorylineIdeaPage() {
  const universeId = await getCurrentUniverseId().catch(() => null);
  if (!universeId) redirect("/admin");

  const canEdit = await getCanEditUniverse(universeId);
  if (!canEdit) redirect("/admin");

  async function createStorylineIdea(
    _prev: IdeaState,
    formData: FormData
  ): Promise<IdeaState> {
    "use server";
    const { universeId } = await requireUniverseEdit();
    const title = (formData.get("title") as string)?.trim();
    const content = (formData.get("content") as string)?.trim() || null;

    if (!title) return { error: "Title is required." };
    if (title.length > 200) return { error: "Title must be 200 characters or less." };

    await prisma.storylineIdea.create({
      data: { universeId, title, content },
    });

    revalidatePath("/admin", "layout");
    return { success: "Idea created." };
  }

  return (
    <EntryEditor
      backHref="/admin"
      saveAction={createStorylineIdea}
      typeName="Idea"
    />
  );
}
