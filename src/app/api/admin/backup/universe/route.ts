import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildUniverseDocx } from "@/lib/docxUtils";

function slugify(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 50) || "universe";
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) return new NextResponse("No universe selected", { status: 400 });

  const universe = await prisma.universe.findUnique({
    where: { id: universeId },
    select: { name: true, description: true },
  });
  if (!universe) return new NextResponse("Universe not found", { status: 404 });

  const [characters, relationships, locations, storylineIdeas, plotItems, notes, images] =
    await Promise.all([
      prisma.character.findMany({
        where: { universeId },
        orderBy: { name: "asc" },
        select: {
          id: true, name: true, characterType: true, subtype: true,
          hairColor: true, eyeColor: true, bodyType: true, attitude: true,
          quirks: true, speakingStyle: true, phrases: true, origin: true,
          livesIn: true, homeDescription: true, vehicles: true, jobs: true,
          pets: true, notes: true,
        },
      }),
      prisma.characterRelationship.findMany({
        where: { fromCharacter: { universeId } },
        select: { fromCharacterId: true, toCharacterId: true, type: true, note: true },
      }),
      prisma.location.findMany({
        where: { universeId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, locatedIn: true, climate: true, atmosphere: true, description: true, notes: true },
      }),
      prisma.storylineIdea.findMany({
        where: { universeId },
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, content: true },
      }),
      prisma.plotItem.findMany({
        where: { universeId },
        orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
        select: { id: true, text: true, checked: true },
      }),
      prisma.note.findMany({
        where: { universeId },
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, content: true },
      }),
      // Fetch full image data including binary
      prisma.image.findMany({
        where: { universeId },
        orderBy: { createdAt: "asc" },
        select: { id: true, label: true, category: true, mimeType: true, data: true },
      }),
    ]);

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  const dateStr = new Date().toISOString().slice(0, 10);
  const slug = slugify(universe.name);

  if (format === "docx") {
    const buf = await buildUniverseDocx({ universe, characters, relationships, locations, storylineIdeas, plotItems, notes, images });
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${slug}-bible-${dateStr}.docx"`,
      },
    });
  }

  // JSON backup — images stored as base64
  const payload = {
    castalia_backup: "universe",
    version: 1,
    exportedAt: new Date().toISOString(),
    universe: { name: universe.name, description: universe.description },
    characters,
    relationships,
    locations,
    storylineIdeas,
    plotItems,
    notes,
    images: images.map((img) => ({
      id: img.id,
      label: img.label,
      category: img.category,
      mimeType: img.mimeType,
      data: Buffer.from(img.data).toString("base64"),
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${slug}-bible-backup-${dateStr}.json"`,
    },
  });
}
