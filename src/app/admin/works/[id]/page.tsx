import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCanEditUniverse } from "@/lib/auth-utils";
import { getCurrentUniverseId } from "@/lib/universe";
import WorkDetail from "./WorkDetail";

export const dynamic = "force-dynamic";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const universeId = await getCurrentUniverseId().catch(() => null);
  if (!universeId) notFound();

  const work = await prisma.work.findFirst({
    where: { id, universeId },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      publishMode: true,
      snippet: true,
      coverImageId: true,
      coverImage: { select: { id: true, label: true } },
      description: true,
      buyLinks: true,
      publishedAt: true,
      openCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!work) notFound();

  const [images, session, canEdit, chapters, rawSubmission, rawDbSub] = await Promise.all([
    work.type === "book"
      ? prisma.image.findMany({
          where: { universeId },
          orderBy: { createdAt: "desc" },
          select: { id: true, label: true, category: true },
        })
      : Promise.resolve([]),
    getSession(),
    getCanEditUniverse(universeId),
    prisma.chapter.findMany({
      where: { workId: id },
      orderBy: { order: "asc" },
      select: { id: true, title: true, order: true },
    }),
    prisma.freeReadSubmission.findUnique({
      where: { workId: id },
      select: {
        id: true,
        submissionType: true,
        selectedChapterIds: true,
        title: true,
        description: true,
        contentRating: true,
        coverBgIndex: true,
        coverImageData: true,
        status: true,
        submittedAt: true,
      },
    }),
    prisma.discoverBooksSubmission.findUnique({
      where: { workId: id },
      select: {
        id: true,
        bookTitle: true,
        authorName: true,
        coverBgIndex: true,
        coverImageData: true,
        purchaseUrl: true,
        purchaseLinkText: true,
        description: true,
        contentRating: true,
        status: true,
        submittedAt: true,
      },
    }),
  ]);

  const isSuperAdmin = session?.isSuperAdmin ?? false;

  // Default author name: use approved author profile headline, else username
  let defaultAuthorName = session?.username ?? "";
  if (session?.userId) {
    const profile = await prisma.authorProfile.findUnique({
      where: { userId: session.userId, status: "approved" },
      select: { headline: true },
    });
    if (profile?.headline) defaultAuthorName = profile.headline;
  }

  const freeReadSubmission = rawSubmission
    ? {
        id: rawSubmission.id,
        submissionType: rawSubmission.submissionType,
        selectedChapterIds: rawSubmission.selectedChapterIds,
        title: rawSubmission.title,
        description: rawSubmission.description,
        contentRating: rawSubmission.contentRating,
        coverBgIndex: rawSubmission.coverBgIndex,
        hasCoverImage: !!rawSubmission.coverImageData,
        status: rawSubmission.status,
        submittedAt: rawSubmission.submittedAt.toISOString(),
      }
    : null;

  const discoverBooksSubmission = rawDbSub
    ? {
        id: rawDbSub.id,
        bookTitle: rawDbSub.bookTitle,
        authorName: rawDbSub.authorName,
        coverBgIndex: rawDbSub.coverBgIndex,
        hasCoverImage: !!rawDbSub.coverImageData,
        purchaseUrl: rawDbSub.purchaseUrl,
        purchaseLinkText: rawDbSub.purchaseLinkText,
        description: rawDbSub.description,
        contentRating: rawDbSub.contentRating,
        status: rawDbSub.status,
        submittedAt: rawDbSub.submittedAt.toISOString(),
      }
    : null;

  return (
    <WorkDetail
      work={work}
      availableImages={images}
      isSuperAdmin={isSuperAdmin}
      canEdit={canEdit}
      chapters={chapters}
      freeReadSubmission={freeReadSubmission}
      discoverBooksSubmission={discoverBooksSubmission}
      defaultAuthorName={defaultAuthorName}
    />
  );
}
