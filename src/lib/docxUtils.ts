import "server-only";

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

// ── HTML entity decoder ───────────────────────────────────────────────────────

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n, 10)));
}

// ── Inline HTML → TextRuns ────────────────────────────────────────────────────

function inlineToRuns(html: string): TextRun[] {
  const runs: TextRun[] = [];
  let bold = false;
  let italic = false;
  let i = 0;

  while (i < html.length) {
    if (html[i] !== "<") {
      const end = html.indexOf("<", i);
      const raw = end === -1 ? html.slice(i) : html.slice(i, end);
      const text = decodeEntities(raw);
      if (text) runs.push(new TextRun({ text, bold, italics: italic }));
      i = end === -1 ? html.length : end;
      continue;
    }

    const close = html.indexOf(">", i);
    if (close === -1) { i = html.length; break; }

    const tagRaw = html.slice(i + 1, close).trim().toLowerCase();
    const isClose = tagRaw.startsWith("/");
    const tagName = tagRaw.replace(/^\//, "").split(/[\s/]/)[0];

    if (tagName === "strong" || tagName === "b") bold = !isClose;
    else if (tagName === "em" || tagName === "i") italic = !isClose;
    else if (tagName === "br") runs.push(new TextRun({ break: 1 }));

    i = close + 1;
  }

  return runs.length > 0 ? runs : [new TextRun({ text: "" })];
}

// ── Block parser ──────────────────────────────────────────────────────────────

type Block = { tag: string; inner: string };

const BLOCK_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "blockquote", "pre"]);

function extractBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) break;
    const gt = html.indexOf(">", lt);
    if (gt === -1) break;

    const tagRaw = html.slice(lt + 1, gt).trim().toLowerCase();
    const isClose = tagRaw.startsWith("/");
    const selfClose = tagRaw.endsWith("/");
    const tagName = tagRaw.replace(/^\//, "").split(/[\s/]/)[0];

    if (isClose) { i = gt + 1; continue; }

    if (selfClose || tagName === "hr" || tagName === "br") {
      if (tagName === "hr") blocks.push({ tag: "hr", inner: "" });
      i = gt + 1;
      continue;
    }

    if (!BLOCK_TAGS.has(tagName)) { i = gt + 1; continue; }

    // Depth-aware close-tag search
    const openTag = `<${tagName}`;
    const closeTag = `</${tagName}>`;
    let depth = 1;
    let j = gt + 1;
    const innerStart = j;

    while (j < html.length && depth > 0) {
      const nextOpen = html.indexOf(openTag, j);
      const nextClose = html.indexOf(closeTag, j);

      if (nextClose === -1) { j = html.length; break; }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        j = nextOpen + openTag.length;
      } else {
        depth--;
        if (depth === 0) {
          blocks.push({ tag: tagName, inner: html.slice(innerStart, nextClose) });
          j = nextClose + closeTag.length;
        } else {
          j = nextClose + closeTag.length;
        }
      }
    }

    i = j;
  }

  return blocks;
}

function extractListItems(html: string): string[] {
  const items: string[] = [];
  let i = 0;
  while (i < html.length) {
    const open = html.indexOf("<li", i);
    if (open === -1) break;
    const tagEnd = html.indexOf(">", open);
    if (tagEnd === -1) break;
    const close = html.indexOf("</li>", tagEnd);
    if (close === -1) break;
    items.push(html.slice(tagEnd + 1, close));
    i = close + 5;
  }
  return items;
}

function stripBlockTags(html: string): string {
  return html.replace(/^<p[^>]*>/, "").replace(/<\/p>$/, "").trim();
}

// ── Shared numbering config ───────────────────────────────────────────────────

const NUMBERING = {
  config: [
    {
      reference: "castalia-bullet",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
      ],
    },
    {
      reference: "castalia-ordered",
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
      ],
    },
  ],
};

// ── TipTap HTML → docx paragraphs ─────────────────────────────────────────────

export function htmlToDocxParagraphs(html: string | null | undefined): Paragraph[] {
  if (!html?.trim()) return [];
  const out: Paragraph[] = [];

  for (const { tag, inner } of extractBlocks(html)) {
    switch (tag) {
      case "p":
        out.push(new Paragraph({ children: inlineToRuns(inner), spacing: { after: 160 } }));
        break;
      case "h1":
        out.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: inlineToRuns(inner), spacing: { before: 400, after: 160 } }));
        break;
      case "h2":
        out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: inlineToRuns(inner), spacing: { before: 300, after: 120 } }));
        break;
      case "h3":
        out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: inlineToRuns(inner), spacing: { before: 240, after: 80 } }));
        break;
      case "h4":
      case "h5":
      case "h6":
        out.push(new Paragraph({ heading: HeadingLevel.HEADING_4, children: inlineToRuns(inner), spacing: { before: 200, after: 80 } }));
        break;
      case "ul":
        for (const item of extractListItems(inner))
          out.push(new Paragraph({ children: inlineToRuns(stripBlockTags(item)), numbering: { reference: "castalia-bullet", level: 0 }, spacing: { after: 80 } }));
        break;
      case "ol":
        for (const item of extractListItems(inner))
          out.push(new Paragraph({ children: inlineToRuns(stripBlockTags(item)), numbering: { reference: "castalia-ordered", level: 0 }, spacing: { after: 80 } }));
        break;
      case "blockquote": {
        const bqBlocks = extractBlocks(inner);
        if (bqBlocks.length > 0) {
          for (const bq of bqBlocks) {
            if (bq.tag === "p")
              out.push(new Paragraph({ children: inlineToRuns(bq.inner), indent: { left: 720, right: 720 }, spacing: { after: 160 } }));
          }
        } else {
          out.push(new Paragraph({ children: inlineToRuns(inner.replace(/<[^>]+>/g, "")), indent: { left: 720 }, spacing: { after: 160 } }));
        }
        break;
      }
      case "hr":
        out.push(new Paragraph({
          children: [],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "AAAAAA" } },
          spacing: { before: 200, after: 200 },
        }));
        break;
    }
  }

  return out;
}

// ── Document helper paragraphs ────────────────────────────────────────────────

export function docSection(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text })],
    spacing: { before: 480, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 4, color: "CCCCCC" } },
  });
}

export function docSubheading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text })],
    spacing: { before: 280, after: 100 },
  });
}

export function docField(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: label + ": ", bold: true }), new TextRun({ text: value })],
    spacing: { after: 80 },
  });
}

export function docSpacer(): Paragraph {
  return new Paragraph({ children: [], spacing: { after: 200 } });
}

function docRule(): Paragraph {
  return new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "888888" } },
    spacing: { before: 160, after: 240 },
  });
}

// ── Work .docx ────────────────────────────────────────────────────────────────

export async function buildWorkDocx(
  work: {
    title: string;
    type: string;
    status: string;
    publishMode: string | null;
    description: string | null;
    content: string | null;
    snippet: string | null;
    publishedAt: Date | null;
  },
  chapters?: { title: string; content: string | null; order: number }[]
): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: work.title })],
      spacing: { after: 240 },
    }),
    docField("Type", work.type === "book" ? "Book" : "Short Story"),
    docField("Status", work.status === "published" ? "Published" : "Private"),
    ...(work.publishMode ? [docField("Publish mode", work.publishMode)] : []),
    ...(work.publishedAt
      ? [docField("Published", work.publishedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))]
      : []),
    ...(work.description ? [docField("Description", work.description)] : []),
    docSpacer(),
    docRule(),
  ];

  // Use chapters if available; fall back to legacy work.content
  const sortedChapters = chapters
    ? [...chapters].sort((a, b) => a.order - b.order)
    : null;

  if (sortedChapters && sortedChapters.length > 0) {
    for (const ch of sortedChapters) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: ch.title })],
          spacing: { before: 480, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 4, color: "CCCCCC" } },
        }),
        ...htmlToDocxParagraphs(ch.content),
      );
    }
  } else {
    children.push(...htmlToDocxParagraphs(work.content));
  }

  if (work.snippet) {
    children.push(
      docRule(),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Public Teaser / Snippet" })], spacing: { before: 240, after: 160 } }),
      ...htmlToDocxParagraphs(work.snippet),
    );
  }

  const doc = new Document({ numbering: NUMBERING, sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}

// ── Universe bible types ──────────────────────────────────────────────────────

export type CharDoc = {
  id: string; name: string; characterType: string; subtype: string | null;
  hairColor: string | null; eyeColor: string | null; bodyType: string | null;
  attitude: string | null; quirks: string | null; speakingStyle: string | null;
  phrases: string | null; origin: string | null; livesIn: string | null;
  homeDescription: string | null; vehicles: string | null; jobs: string | null;
  pets: string | null; notes: string | null;
};
export type RelDoc = { fromCharacterId: string; toCharacterId: string; type: string; note: string | null };
export type LocDoc = { id: string; name: string; locatedIn: string | null; climate: string | null; atmosphere: string | null; description: string | null; notes: string | null };
export type IdeaDoc = { id: string; title: string; content: string | null };
export type PlotDoc = { id: string; text: string; checked: boolean };
export type NoteDoc = { id: string; title: string; content: string | null };
export type ImgDoc = { id: string; label: string; category: string; mimeType: string; data: Buffer | Uint8Array };

// ── Universe bible .docx ──────────────────────────────────────────────────────

export async function buildUniverseDocx(data: {
  universe: { name: string; description: string | null };
  characters: CharDoc[];
  relationships: RelDoc[];
  locations: LocDoc[];
  storylineIdeas: IdeaDoc[];
  plotItems: PlotDoc[];
  notes: NoteDoc[];
  images: ImgDoc[];
}): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: `${data.universe.name} — Story Bible` })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Exported ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, italics: true })],
      spacing: { after: 400 },
    }),
  );

  if (data.universe.description) {
    children.push(new Paragraph({ children: [new TextRun({ text: data.universe.description, italics: true })], spacing: { after: 400 } }));
  }

  // ── Characters ──
  if (data.characters.length > 0) {
    children.push(docSection("Characters"));
    for (const ch of data.characters) {
      children.push(docSubheading(ch.name));
      children.push(docField("Type", ch.characterType + (ch.subtype ? ` — ${ch.subtype}` : "")));
      const fields: [string, string | null][] = [
        ["Hair", ch.hairColor], ["Eyes", ch.eyeColor], ["Build", ch.bodyType],
        ["Attitude", ch.attitude], ["Quirks", ch.quirks], ["Speaking style", ch.speakingStyle],
        ["Phrases", ch.phrases], ["Origin", ch.origin], ["Lives in", ch.livesIn],
        ["Home", ch.homeDescription], ["Vehicles", ch.vehicles], ["Jobs", ch.jobs], ["Pets", ch.pets],
      ];
      for (const [lbl, val] of fields) if (val) children.push(docField(lbl, val));
      if (ch.notes) children.push(new Paragraph({ children: [new TextRun({ text: ch.notes })], spacing: { after: 100 } }));

      const rels = data.relationships.filter((r) => r.fromCharacterId === ch.id);
      if (rels.length > 0) {
        const relStr = rels.map((r) => {
          const other = data.characters.find((c) => c.id === r.toCharacterId);
          return `${r.type}${r.note ? ` (${r.note})` : ""} with ${other?.name ?? "unknown"}`;
        }).join("; ");
        children.push(docField("Relationships", relStr));
      }
      children.push(docSpacer());
    }
  }

  // ── Locations ──
  if (data.locations.length > 0) {
    children.push(docSection("Locations"));
    for (const loc of data.locations) {
      children.push(docSubheading(loc.name));
      for (const [lbl, val] of [["Located in", loc.locatedIn], ["Climate", loc.climate], ["Atmosphere", loc.atmosphere]] as [string, string | null][])
        if (val) children.push(docField(lbl, val));
      if (loc.description) children.push(new Paragraph({ children: [new TextRun({ text: loc.description })], spacing: { after: 100 } }));
      if (loc.notes) children.push(new Paragraph({ children: [new TextRun({ text: loc.notes, italics: true })], spacing: { after: 100 } }));
      children.push(docSpacer());
    }
  }

  // ── Storyline Ideas ──
  if (data.storylineIdeas.length > 0) {
    children.push(docSection("Storyline Ideas"));
    for (const idea of data.storylineIdeas) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: idea.title })], spacing: { before: 240, after: 100 } }));
      if (idea.content) children.push(new Paragraph({ children: [new TextRun({ text: idea.content })], spacing: { after: 160 } }));
    }
  }

  // ── Plot Checklist ──
  if (data.plotItems.length > 0) {
    children.push(docSection("Plot Checklist"));
    for (const item of data.plotItems.filter((p) => !p.checked))
      children.push(new Paragraph({ children: [new TextRun({ text: `☐ ${item.text}` })], spacing: { after: 80 } }));
    for (const item of data.plotItems.filter((p) => p.checked))
      children.push(new Paragraph({ children: [new TextRun({ text: `☑ ${item.text}`, color: "888888" })], spacing: { after: 80 } }));
  }

  // ── General Notes ──
  if (data.notes.length > 0) {
    children.push(docSection("General Notes"));
    for (const note of data.notes) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: note.title })], spacing: { before: 240, after: 100 } }));
      if (note.content) children.push(new Paragraph({ children: [new TextRun({ text: note.content })], spacing: { after: 160 } }));
    }
  }

  // ── Images ──
  if (data.images.length > 0) {
    children.push(docSection("Images"));
    for (const img of data.images) {
      children.push(docSubheading(img.label));
      children.push(docField("Category", img.category));
      try {
        children.push(new Paragraph({
          children: [new ImageRun({ data: Buffer.from(img.data), transformation: { width: 350, height: 350 }, type: "jpg" })],
          spacing: { after: 240 },
        }));
      } catch {
        children.push(new Paragraph({ children: [new TextRun({ text: "(Image data unavailable)", italics: true })], spacing: { after: 240 } }));
      }
      children.push(docSpacer());
    }
  }

  const doc = new Document({ numbering: NUMBERING, sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}
