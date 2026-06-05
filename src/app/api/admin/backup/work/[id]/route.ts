import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildWorkDocx } from "@/lib/docxUtils";

function slugify(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "untitled";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) return new NextResponse("No universe selected", { status: 400 });

  const work = await prisma.work.findFirst({
    where: { id, universeId },
    select: {
      id: true, title: true, type: true, status: true, publishMode: true,
      content: true, snippet: true, description: true, buyLinks: true,
      publishedAt: true, openCount: true, createdAt: true,
    },
  });
  if (!work) return new NextResponse("Not found", { status: 404 });

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  const dateStr = new Date().toISOString().slice(0, 10);
  const slug = slugify(work.title);

  if (format === "docx") {
    const buf = await buildWorkDocx(work);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${slug}-${dateStr}.docx"`,
      },
    });
  }

  // JSON backup
  const payload = {
    castalia_backup: "work",
    version: 1,
    exportedAt: new Date().toISOString(),
    work: {
      title: work.title,
      type: work.type,
      status: work.status,
      publishMode: work.publishMode,
      content: work.content,
      snippet: work.snippet,
      description: work.description,
      buyLinks: work.buyLinks,
      openCount: work.openCount,
      publishedAt: work.publishedAt?.toISOString() ?? null,
      createdAt: work.createdAt.toISOString(),
    },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${slug}-backup-${dateStr}.json"`,
    },
  });
}
