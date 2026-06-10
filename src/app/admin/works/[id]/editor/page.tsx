import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WritingEditor from "@/components/WritingEditor";
import { getFlags } from "@/app/actions/flags";
import { getCanEditUniverse } from "@/lib/auth-utils";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const work = await prisma.work.findFirst({
    where: { id, universeId },
    select: { id: true, title: true, type: true, content: true, status: true, snippet: true },
  });
  if (!work) notFound();

  // Fetch existing chapters in order
  let chapters = await prisma.chapter.findMany({
    where: { workId: id },
    orderBy: { order: "asc" },
    select: { id: true, title: true, content: true, order: true },
  });

  const canEdit = await getCanEditUniverse(universeId);

  // First time opening the chapter editor: seed a Chapter from legacy Work.content
  // Only do this for users with edit access — view-only users read whatever exists
  if (chapters.length === 0 && canEdit) {
    const seeded = await prisma.chapter.create({
      data: {
        workId: id,
        title: "Chapter 1",
        content: work.content ?? "",
        order: 0,
      },
    });
    chapters = [{ id: seeded.id, title: seeded.title, content: seeded.content, order: seeded.order }];
  }

  const rawFlags = await getFlags(work.id);
  const flags = rawFlags.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }));

  return (
    <WritingEditor
      workId={work.id}
      title={work.title}
      workType={work.type}
      initialChapters={chapters}
      savedSnippet={work.snippet}
      backHref={`/admin/works/${work.id}`}
      initialFlags={flags}
      canEdit={canEdit}
    />
  );
}
