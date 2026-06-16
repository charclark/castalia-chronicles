import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.isSuperAdmin) return new NextResponse(null, { status: 403 });

  const { id } = await params;
  const sub = await prisma.discoverBooksSubmission.findUnique({
    where: { id },
    select: { pendingCoverImageData: true },
  });
  if (!sub?.pendingCoverImageData) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(sub.pendingCoverImageData as Uint8Array), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-cache" },
  });
}
