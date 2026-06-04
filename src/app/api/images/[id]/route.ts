import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const image = await prisma.image.findFirst({
    where: { id },
    select: { data: true, mimeType: true },
  });
  if (!image) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(image.data, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
