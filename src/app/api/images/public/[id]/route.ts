import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serves cover images only for published works — no admin auth required.
// Prevents leaking images from unpublished/private works.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const publishedWork = await prisma.work.findFirst({
    where: { coverImageId: id, status: "published" },
    select: { id: true },
  });
  if (!publishedWork) return new NextResponse("Not found", { status: 404 });

  const image = await prisma.image.findFirst({
    where: { id },
    select: { data: true, mimeType: true },
  });
  if (!image) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(image.data, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
