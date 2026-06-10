import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getCanEditUniverse } from "@/lib/auth-utils";
import EntryEditor from "@/components/EntryEditor";
import { createStorylineIdea } from "@/app/actions/storyline-ideas";

export default async function NewStorylineIdeaPage() {
  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

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
