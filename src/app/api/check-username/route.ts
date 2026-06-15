import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.trim().toLowerCase();
  if (!username || username.length < 2) {
    return NextResponse.json({ available: null });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
      select: { id: true },
    });
    return NextResponse.json({ available: !existing });
  } catch {
    return NextResponse.json({ available: null }, { status: 500 });
  }
}
