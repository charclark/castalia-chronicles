import { redirect } from "next/navigation";
import { getCanEditUniverse } from "@/lib/auth-utils";
import { getCurrentUniverseId } from "@/lib/universe";
import EntryEditor from "@/components/EntryEditor";
import { createStorylineIdea } from "@/app/actions/storyline-ideas";

export default async function NewStorylineIdeaPage() {
  const universeId = await getCurrentUniverseId().catch(() => null);
  if (!universeId) redirect("/admin");

  const canEdit = await getCanEditUniverse(universeId);
  if (!canEdit) redirect("/admin");

  return (
    <EntryEditor
      backHref="/admin"
      saveAction={createStorylineIdea}
      typeName="Idea"
    />
  );
}
