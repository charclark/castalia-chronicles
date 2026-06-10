import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCanEditUniverse } from "@/lib/auth-utils";
import WorkDetail from "./WorkDetail";

export default async function WorkPage({
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

  // For the cover image selector (books only) — fetch all images in universe
  const images =
    work.type === "book"
      ? await prisma.image.findMany({
          where: { universeId },
          orderBy: { createdAt: "desc" },
          select: { id: true, label: true, category: true },
        })
      : [];

  const [session, canEdit] = await Promise.all([
    getSession(),
    getCanEditUniverse(universeId),
  ]);
  const isSuperAdmin = session?.isSuperAdmin ?? false;

  return <WorkDetail work={work} availableImages={images} isSuperAdmin={isSuperAdmin} canEdit={canEdit} />;
}
