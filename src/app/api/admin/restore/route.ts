import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}
function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) return NextResponse.json({ error: "No universe selected" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const backup = body as Record<string, unknown>;

  // ── Work restore ─────────────────────────────────────────────────────────────
  if (backup.castalia_backup === "work") {
    const w = backup.work as Record<string, unknown>;
    if (!w || !str(w.title)) return NextResponse.json({ error: "Invalid work backup: missing title" }, { status: 400 });

    const work = await prisma.work.create({
      data: {
        universeId,
        title: str(w.title, "Restored Work") + " (restored)",
        type: str(w.type) === "book" ? "book" : "short story",
        content: strOrNull(w.content),
        snippet: strOrNull(w.snippet),
        description: strOrNull(w.description),
        buyLinks: strOrNull(w.buyLinks),
        status: "private",
        publishMode: null,
      },
    });

    return NextResponse.json({ success: true, type: "work", id: work.id, title: work.title });
  }

  // ── Universe bible restore ────────────────────────────────────────────────────
  if (backup.castalia_backup === "universe") {
    const characters = Array.isArray(backup.characters) ? backup.characters : [];
    const relationships = Array.isArray(backup.relationships) ? backup.relationships : [];
    const locations = Array.isArray(backup.locations) ? backup.locations : [];
    const storylineIdeas = Array.isArray(backup.storylineIdeas) ? backup.storylineIdeas : [];
    const plotItems = Array.isArray(backup.plotItems) ? backup.plotItems : [];
    const notes = Array.isArray(backup.notes) ? backup.notes : [];
    const images = Array.isArray(backup.images) ? backup.images : [];

    // Map old IDs → new IDs for relationship/image restoration
    const charIdMap: Record<string, string> = {};
    const imgIdMap: Record<string, string> = {};

    // Restore characters
    for (const c of characters as Record<string, unknown>[]) {
      if (!str(c.name)) continue;
      const newChar = await prisma.character.create({
        data: {
          universeId,
          name: str(c.name, "Unknown"),
          characterType: str(c.characterType, "Human"),
          subtype: strOrNull(c.subtype),
          hairColor: strOrNull(c.hairColor),
          eyeColor: strOrNull(c.eyeColor),
          bodyType: strOrNull(c.bodyType),
          attitude: strOrNull(c.attitude),
          quirks: strOrNull(c.quirks),
          speakingStyle: strOrNull(c.speakingStyle),
          phrases: strOrNull(c.phrases),
          origin: strOrNull(c.origin),
          livesIn: strOrNull(c.livesIn),
          homeDescription: strOrNull(c.homeDescription),
          vehicles: strOrNull(c.vehicles),
          jobs: strOrNull(c.jobs),
          pets: strOrNull(c.pets),
          notes: strOrNull(c.notes),
        },
      });
      if (str(c.id)) charIdMap[str(c.id)] = newChar.id;
    }

    // Restore relationships
    for (const r of relationships as Record<string, unknown>[]) {
      const fromId = charIdMap[str(r.fromCharacterId)];
      const toId = charIdMap[str(r.toCharacterId)];
      if (!fromId || !toId) continue;
      const relType = str(r.type);
      if (!["relative", "friend", "enemy"].includes(relType)) continue;
      await prisma.characterRelationship.create({
        data: { fromCharacterId: fromId, toCharacterId: toId, type: relType, note: strOrNull(r.note) },
      });
    }

    // Restore images
    for (const img of images as Record<string, unknown>[]) {
      if (!str(img.label) || typeof img.data !== "string") continue;
      let imgData: Uint8Array<ArrayBuffer>;
      try { imgData = Uint8Array.from(Buffer.from(img.data, "base64")); }
      catch { continue; }
      const newImg = await prisma.image.create({
        data: {
          universeId,
          label: str(img.label, "Restored image"),
          category: str(img.category, "other"),
          mimeType: str(img.mimeType, "image/jpeg"),
          data: imgData,
        },
      });
      if (str(img.id)) imgIdMap[str(img.id)] = newImg.id;
    }

    // Restore locations
    for (const loc of locations as Record<string, unknown>[]) {
      if (!str(loc.name)) continue;
      await prisma.location.create({
        data: {
          universeId,
          name: str(loc.name, "Unknown"),
          locatedIn: strOrNull(loc.locatedIn),
          climate: strOrNull(loc.climate),
          atmosphere: strOrNull(loc.atmosphere),
          description: strOrNull(loc.description),
          notes: strOrNull(loc.notes),
        },
      });
    }

    // Restore storyline ideas
    for (const idea of storylineIdeas as Record<string, unknown>[]) {
      if (!str(idea.title)) continue;
      await prisma.storylineIdea.create({
        data: { universeId, title: str(idea.title, "Restored idea"), content: strOrNull(idea.content) },
      });
    }

    // Restore plot items
    for (const item of plotItems as Record<string, unknown>[]) {
      if (!str(item.text)) continue;
      await prisma.plotItem.create({
        data: { universeId, text: str(item.text), checked: bool(item.checked, false) },
      });
    }

    // Restore notes
    for (const note of notes as Record<string, unknown>[]) {
      if (!str(note.title)) continue;
      await prisma.note.create({
        data: { universeId, title: str(note.title, "Restored note"), content: strOrNull(note.content) },
      });
    }

    return NextResponse.json({
      success: true,
      type: "universe",
      counts: {
        characters: Object.keys(charIdMap).length,
        relationships: Object.keys(charIdMap).length > 0 ? relationships.length : 0,
        locations: locations.length,
        storylineIdeas: storylineIdeas.length,
        plotItems: plotItems.length,
        notes: notes.length,
        images: Object.keys(imgIdMap).length,
      },
    });
  }

  return NextResponse.json({ error: "Unrecognised backup type. Expected castalia_backup = 'work' or 'universe'." }, { status: 400 });
}
