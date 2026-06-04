import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
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

  const image = await prisma.image.findFirst({
    where: { id, universeId },
    select: { id: true, label: true, category: true, createdAt: true },
  });
  if (!image) notFound();

  return <ImageDetail image={image} />;
}
