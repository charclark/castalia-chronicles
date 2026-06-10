import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getCanEditUniverse } from "@/lib/auth-utils";
import EntryEditor from "@/components/EntryEditor";
import { createNote } from "@/app/actions/notes";

export default async function NewNotePage() {
  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const canEdit = await getCanEditUniverse(universeId);
  if (!canEdit) redirect("/admin");

  return (
    <EntryEditor
      backHref="/admin"
      saveAction={createNote}
      typeName="Note"
    />
  );
}
