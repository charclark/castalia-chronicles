import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WritingEditor from "@/components/WritingEditor";

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

  return (
    <WritingEditor
      workId={work.id}
      title={work.title}
      workType={work.type}
      initialContent={work.content}
      savedSnippet={work.snippet}
      backHref={`/admin/works/${work.id}`}
    />
  );
}
