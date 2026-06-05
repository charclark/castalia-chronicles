import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public — no auth required. Serves the author photo for the About page.
export async function GET() {
  const settings = await prisma.siteSettings.findFirst({
    where: { id: "singleton" },
    select: { photoData: true },
  });

  if (!settings?.photoData) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(settings.photoData, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
