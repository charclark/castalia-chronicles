import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCanEditUniverse } from "@/lib/auth-utils";
import EntryEditor from "@/components/EntryEditor";
import { updateStorylineIdea, deleteStorylineIdea } from "@/app/actions/storyline-ideas";

export default async function StorylineIdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const [idea, canEdit] = await Promise.all([
    prisma.storylineIdea.findFirst({ where: { id, universeId } }),
    getCanEditUniverse(universeId),
  ]);
  if (!idea) notFound();

  return (
    <EntryEditor
      id={idea.id}
      title={idea.title}
      content={idea.content}
      backHref="/admin"
      saveAction={updateStorylineIdea}
      deleteAction={deleteStorylineIdea}
      typeName="Idea"
      readOnly={!canEdit}
    />
  );
}
