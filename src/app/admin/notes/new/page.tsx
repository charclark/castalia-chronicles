import EntryEditor from "@/components/EntryEditor";
import { createNote } from "@/app/actions/notes";

export default function NewNotePage() {
  return (
    <EntryEditor
      backHref="/admin"
      saveAction={createNote}
      typeName="Note"
    />
  );
}
