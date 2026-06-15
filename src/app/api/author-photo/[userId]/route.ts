import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const profile = await prisma.authorProfile.findUnique({
    where: { userId },
    select: { photoData: true },
  });

  if (!profile?.photoData) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(profile.photoData, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
