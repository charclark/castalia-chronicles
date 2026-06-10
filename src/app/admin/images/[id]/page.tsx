import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCanEditUniverse } from "@/lib/auth-utils";
import ImageDetail from "./ImageDetail";

export default async function ImagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const [image, canEdit] = await Promise.all([
    prisma.image.findFirst({
      where: { id, universeId },
      select: { id: true, label: true, category: true, createdAt: true },
    }),
    getCanEditUniverse(universeId),
  ]);
  if (!image) notFound();

  return <ImageDetail image={image} canEdit={canEdit} />;
}
