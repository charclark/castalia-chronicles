import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCanEditUniverse } from "@/lib/auth-utils";
import EntryEditor from "@/components/EntryEditor";
import { updateNote, deleteNote } from "@/app/actions/notes";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const [note, canEdit] = await Promise.all([
    prisma.note.findFirst({ where: { id, universeId } }),
    getCanEditUniverse(universeId),
  ]);
  if (!note) notFound();

  return (
    <EntryEditor
      id={note.id}
      title={note.title}
      content={note.content}
      backHref="/admin"
      saveAction={updateNote}
      deleteAction={deleteNote}
      typeName="Note"
      readOnly={!canEdit}
    />
  );
}
