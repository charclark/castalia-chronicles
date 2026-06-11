import { redirect } from "next/navigation";
import { getCanEditUniverse } from "@/lib/auth-utils";
import { getCurrentUniverseId } from "@/lib/universe";
import EntryEditor from "@/components/EntryEditor";
import { createNote } from "@/app/actions/notes";

export default async function NewNotePage() {
  const universeId = await getCurrentUniverseId().catch(() => null);
  if (!universeId) redirect("/admin");

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
