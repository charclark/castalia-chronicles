"use client";

import {
  useEditor,
  EditorContent,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useRouter } from "next/navigation";
import {
  createChapter,
  renameChapter,
  deleteChapter,
  saveChapterContent,
  reorderChapters,
} from "@/app/actions/chapters";
import { updateSnippet } from "@/app/actions/works";
import { createFlag, deleteFlag } from "@/app/actions/flags";
import TwoStepDestroyConfirm from "./TwoStepDestroyConfirm";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChapterData = {
  id: string;
  title: string;
  content: string | null;
  order: number;
};

type SaveStatus = "idle" | "saving" | "saved";

export type FlagData = {
  id: string;
  workId: string;
  chapterId: string;
  color: string;
  fromOffset: number;
  toOffset: number;
  snippet: string;
  createdAt: string | Date;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 15) return "Just saved";
  if (diff < 60) return `Saved ${diff}s ago`;
  return `Saved ${Math.floor(diff / 60)} min ago`;
}

// ── Text offset helpers ───────────────────────────────────────────────────────
// Flags store plain-text character offsets, which are stable across HTML
// re-renders and can be used in both the TipTap editor and the static HTML
// full-story view.

function textOffsetToDocPos(doc: ProseMirrorNode, textOffset: number): number {
  let remaining = textOffset;
  let result: number | null = null;
  doc.descendants((node, pos) => {
    if (result !== null) return false;
    if (node.isText && node.text) {
      if (remaining <= node.text.length) {
        result = pos + remaining;
        return false;
      }
      remaining -= node.text.length;
    }
  });
  return result ?? (doc.content.size > 0 ? doc.content.size - 1 : 1);
}

function docPosToTextOffset(doc: ProseMirrorNode, docPos: number): number {
  let offset = 0;
  let done = false;
  doc.descendants((node, pos) => {
    if (done) return false;
    if (node.isText && node.text) {
      const nodeEnd = pos + node.text.length;
      if (docPos <= nodeEnd) {
        offset += docPos - pos;
        done = true;
        return false;
      }
      offset += node.text.length;
    }
  });
  return offset;
}

// ── DOM helpers for full-story flag creation ──────────────────────────────────

function findChapterContainer(node: Node): HTMLElement | null {
  let cur: Node | null = node;
  while (cur) {
    if (cur instanceof HTMLElement && cur.dataset.chapterId) return cur;
    cur = cur.parentNode;
  }
  return null;
}

function getDomTextOffset(container: HTMLElement, targetNode: Node, targetOffset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      // skip text inside injected flag widgets
      let p = (n as Node).parentElement;
      while (p && p !== container) {
        if (p.dataset?.flagWidget) return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let offset = 0;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node === targetNode) return offset + targetOffset;
    offset += node.textContent?.length ?? 0;
  }
  return offset;
}

// ── Search ProseMirror plugin ──────────────────────────────────────────────────

const searchPluginKey = new PluginKey<{
  query: string;
  matches: { from: number; to: number }[];
  currentIdx: number;
}>("editor-search");

function findDocMatches(doc: Parameters<typeof DecorationSet.create>[0], query: string) {
  if (!query.trim()) return [];
  const matches: { from: number; to: number }[] = [];
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    let m: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((m = regex.exec(node.text)) !== null) {
      matches.push({ from: pos + m.index, to: pos + m.index + m[0].length });
    }
  });

  return matches;
}

const SearchExtension = Extension.create({
  name: "editorSearch",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init: () => ({ query: "", matches: [] as { from: number; to: number }[], currentIdx: 0 }),
          apply(tr, old) {
            const meta = tr.getMeta(searchPluginKey);
            return meta !== undefined ? meta : old;
          },
        },
        props: {
          decorations(state) {
            const pluginState = searchPluginKey.getState(state);
            if (!pluginState || !pluginState.query || !pluginState.matches.length) {
              return DecorationSet.empty;
            }
            const { matches, currentIdx } = pluginState;
            const decs = matches.map((m, i) =>
              Decoration.inline(m.from, m.to, {
                class: i === currentIdx ? "search-match search-match--current" : "search-match",
                nodeName: "span",
              })
            );
            return DecorationSet.create(state.doc, decs);
          },
        },
      }),
    ];
  },
});

function applyEditorSearch(editor: Editor, query: string, idx: number): number {
  const matches = findDocMatches(editor.state.doc, query);
  const clampedIdx = matches.length > 0 ? Math.max(0, Math.min(idx, matches.length - 1)) : 0;

  editor.view.dispatch(
    editor.state.tr.setMeta(searchPluginKey, { query, matches, currentIdx: clampedIdx })
  );

  if (matches[clampedIdx]) {
    const m = matches[clampedIdx];
    editor.commands.setTextSelection({ from: m.from, to: m.to });
    setTimeout(() => {
      const el = editor.view.dom.querySelector(".search-match--current");
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 0);
  }

  return matches.length;
}

function clearEditorSearch(editor: Editor | null) {
  if (!editor) return;
  editor.view.dispatch(
    editor.state.tr.setMeta(searchPluginKey, { query: "", matches: [], currentIdx: 0 })
  );
}

function removeAllHighlights(editor: Editor) {
  const highlightType = editor.schema.marks.highlight;
  if (!highlightType) return;
  const { tr, doc } = editor.state;
  let changed = false;
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    if (node.marks.some((m) => m.type === highlightType)) {
      tr.removeMark(pos, pos + node.nodeSize, highlightType);
      changed = true;
    }
  });
  if (changed) editor.view.dispatch(tr);
}

// ── Flag ProseMirror plugin ───────────────────────────────────────────────────

const flagPluginKey = new PluginKey<DecorationSet>("editor-flags");

function buildFlagDecorations(
  doc: ProseMirrorNode,
  flags: FlagData[],
  chapterId: string
): DecorationSet {
  const chapterFlags = flags.filter((f) => f.chapterId === chapterId);
  if (!chapterFlags.length) return DecorationSet.empty;

  const decs: Decoration[] = [];

  for (const flag of chapterFlags) {
    const from = textOffsetToDocPos(doc, flag.fromOffset);
    const to = textOffsetToDocPos(doc, flag.toOffset);
    if (from >= to || from < 1 || to > doc.content.size) continue;

    // Subtle background on the flagged range
    decs.push(
      Decoration.inline(from, to, {
        class: `flag-range flag-range--${flag.color}`,
        nodeName: "span",
      })
    );

    // Zero-width widget that pokes into the left margin
    decs.push(
      Decoration.widget(
        from,
        () => {
          const wrap = document.createElement("span");
          wrap.className = "flag-widget";
          const icon = document.createElement("span");
          icon.className = "flag-icon";
          icon.textContent = "⚑";
          icon.style.color = flag.color === "yellow" ? "#c9a84c" : "#8b2635";
          icon.title = `${flag.color === "yellow" ? "Revisit" : "Urgent"}: ${flag.snippet}`;
          wrap.appendChild(icon);
          return wrap;
        },
        { side: -1 }
      )
    );
  }

  return DecorationSet.create(doc, decs);
}

function makeFlagPlugin(
  chapterId: string,
  flagsRef: React.MutableRefObject<FlagData[]>
): Plugin {
  return new Plugin({
    key: flagPluginKey,
    state: {
      init(_, state) {
        return buildFlagDecorations(state.doc, flagsRef.current, chapterId);
      },
      apply(tr, old, _, state) {
        if (tr.docChanged || tr.getMeta(flagPluginKey) === "update") {
          return buildFlagDecorations(state.doc, flagsRef.current, chapterId);
        }
        return old;
      },
    },
    props: {
      decorations(state) {
        return flagPluginKey.getState(state) ?? DecorationSet.empty;
      },
    },
  });
}

// ── Full-story HTML helpers ───────────────────────────────────────────────────

function injectFlagAtOffset(
  body: HTMLElement,
  doc: Document,
  offset: number,
  color: string,
  snippet: string
) {
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      let p = (n as Node).parentElement;
      while (p && p !== body) {
        if (p.dataset?.flagWidget) return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let charCount = 0;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const text = textNode.textContent ?? "";
    const nodeEnd = charCount + text.length;

    if (offset >= charCount && offset <= nodeEnd) {
      const local = offset - charCount;
      const parent = textNode.parentNode!;

      const before = doc.createTextNode(text.slice(0, local));
      const wrap = doc.createElement("span");
      wrap.className = `flag-widget flag-widget--${color}`;
      wrap.setAttribute("data-flag-widget", "1");
      wrap.title = `${color === "yellow" ? "Revisit" : "Urgent"}: ${snippet}`;
      const icon = doc.createElement("span");
      icon.className = "flag-icon";
      icon.textContent = "⚑";
      icon.style.color = color === "yellow" ? "#c9a84c" : "#8b2635";
      wrap.appendChild(icon);
      const after = doc.createTextNode(text.slice(local));

      parent.insertBefore(before, textNode);
      parent.insertBefore(wrap, textNode);
      parent.insertBefore(after, textNode);
      parent.removeChild(textNode);
      return;
    }

    charCount = nodeEnd;
  }
}

function injectAllFlagMarks(html: string, flags: FlagData[], chapterId: string): string {
  if (!html) return html;
  const chapterFlags = flags.filter((f) => f.chapterId === chapterId);
  if (!chapterFlags.length) return html;

  const parser = new DOMParser();
  const d = parser.parseFromString(`<body>${html}</body>`, "text/html");

  // Inject in descending order so earlier offsets stay accurate
  const sorted = [...chapterFlags].sort((a, b) => b.fromOffset - a.fromOffset);
  for (const flag of sorted) {
    injectFlagAtOffset(d.body, d, flag.fromOffset, flag.color, flag.snippet);
  }

  return d.body.innerHTML;
}

function injectSearchMarks(
  html: string,
  query: string,
  currentGlobalIdx: number,
  matchOffset: number
): { html: string; count: number } {
  if (!query.trim() || !html) return { html, count: 0 };

  const parser = new DOMParser();
  const d = parser.parseFromString(`<body>${html}</body>`, "text/html");

  let matchCount = 0;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");

  const walker = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) textNodes.push(node as Text);

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? "";
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    const parts: Node[] = [];
    let lastIdx = 0;

    while ((m = regex.exec(text)) !== null) {
      if (m.index > lastIdx) parts.push(d.createTextNode(text.slice(lastIdx, m.index)));
      const globalIdx = matchOffset + matchCount;
      const mark = d.createElement("mark");
      mark.className =
        globalIdx === currentGlobalIdx
          ? "search-match search-match--current"
          : "search-match";
      if (globalIdx === currentGlobalIdx) mark.setAttribute("id", "fs-search-current");
      mark.textContent = m[0];
      parts.push(mark);
      matchCount++;
      lastIdx = regex.lastIndex;
    }

    if (parts.length > 0) {
      if (lastIdx < text.length) parts.push(d.createTextNode(text.slice(lastIdx)));
      const parent = textNode.parentNode!;
      for (const p of parts) parent.insertBefore(p, textNode);
      parent.removeChild(textNode);
    }
  }

  return { html: d.body.innerHTML, count: matchCount };
}

// ── Toolbar button ────────────────────────────────────────────────────────────

function ToolbarButton({
  label,
  title,
  active,
  onClick,
  disabled,
}: {
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      style={{
        background: active ? "rgba(201,168,76,0.12)" : "transparent",
        border: `1px solid ${active ? "var(--color-gold-dim)" : "var(--color-border)"}`,
        borderRadius: "3px",
        padding: "0.2rem 0.55rem",
        color: active
          ? "var(--color-gold)"
          : disabled
          ? "var(--color-ink-faint)"
          : "var(--color-ink-muted)",
        fontFamily: "var(--font-heading)",
        fontSize: "0.82rem",
        letterSpacing: "0.04em",
        cursor: disabled ? "default" : "pointer",
        lineHeight: 1.5,
        minWidth: "32px",
        textAlign: "center",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}

// ── Shared toolbar markup ─────────────────────────────────────────────────────

function EditorToolbar({
  editor,
  onSnippet,
  snippetStatus,
  snippetLen,
  hasSelection,
  onToggleSearch,
  searchActive,
}: {
  editor: Editor | null;
  onSnippet?: () => void;
  snippetStatus?: "idle" | "saving" | "saved";
  snippetLen?: number;
  hasSelection?: boolean;
  onToggleSearch: () => void;
  searchActive: boolean;
  // onRemoveHighlights intentionally omitted from props — called directly via editor
}) {
  const marks = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive("bold") ?? false,
      italic: ctx.editor?.isActive("italic") ?? false,
      underline: ctx.editor?.isActive("underline") ?? false,
      strike: ctx.editor?.isActive("strike") ?? false,
      highlight: ctx.editor?.isActive("highlight") ?? false,
      h1: ctx.editor?.isActive("heading", { level: 1 }) ?? false,
      h2: ctx.editor?.isActive("heading", { level: 2 }) ?? false,
      h3: ctx.editor?.isActive("heading", { level: 3 }) ?? false,
      para: ctx.editor?.isActive("paragraph") ?? false,
    }),
  });

  const noEditor = !editor;

  return (
    <div
      style={{
        display: "flex",
        gap: "0.35rem",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {/* Bold / Italic / Underline / Highlight / Strike */}
      <ToolbarButton label="B" title="Bold (⌘B)" active={marks?.bold ?? false}
        onClick={() => editor?.chain().focus().toggleBold().run()} disabled={noEditor} />
      <ToolbarButton label="I" title="Italic (⌘I)" active={marks?.italic ?? false}
        onClick={() => editor?.chain().focus().toggleItalic().run()} disabled={noEditor} />
      <ToolbarButton label="U" title="Underline (⌘U)" active={marks?.underline ?? false}
        onClick={() => editor?.chain().focus().toggleUnderline().run()} disabled={noEditor} />
      <ToolbarButton label="✦" title="Highlight (yellow)" active={marks?.highlight ?? false}
        onClick={() => editor?.chain().focus().toggleHighlight().run()} disabled={noEditor} />
      <ToolbarButton label="S̶" title="Strikethrough" active={marks?.strike ?? false}
        onClick={() => editor?.chain().focus().toggleStrike().run()} disabled={noEditor} />

      <div style={{ width: "1px", height: "18px", background: "var(--color-border)", margin: "0 0.1rem" }} />

      {/* Heading levels + Normal */}
      <ToolbarButton label="1" title="Heading 1 (largest)" active={marks?.h1 ?? false}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} disabled={noEditor} />
      <ToolbarButton label="2" title="Heading 2" active={marks?.h2 ?? false}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} disabled={noEditor} />
      <ToolbarButton label="3" title="Heading 3" active={marks?.h3 ?? false}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} disabled={noEditor} />
      <ToolbarButton label="NORMAL" title="Normal body text" active={marks?.para ?? false}
        onClick={() => editor?.chain().focus().setParagraph().run()} disabled={noEditor} />

      {/* Snippet button (chapter editor only) */}
      {onSnippet && (
        <>
          <div style={{ width: "1px", height: "18px", background: "var(--color-border)", margin: "0 0.1rem" }} />
          <button
            type="button"
            title={hasSelection ? "Save selection as public snippet" : "Select text to set as snippet"}
            onMouseDown={(e) => {
              e.preventDefault();
              if (hasSelection && snippetStatus === "idle") onSnippet();
            }}
            disabled={!hasSelection || snippetStatus === "saving"}
            style={{
              background: snippetStatus === "saved" ? "rgba(201,168,76,0.12)" : "transparent",
              border: `1px solid ${snippetStatus === "saved" ? "var(--color-gold-dim)" : "var(--color-border)"}`,
              borderRadius: "3px",
              padding: "0.2rem 0.65rem",
              color: snippetStatus === "saved" ? "var(--color-gold)" : hasSelection ? "var(--color-ink-muted)" : "var(--color-ink-faint)",
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              letterSpacing: "0.04em",
              cursor: hasSelection && snippetStatus === "idle" ? "pointer" : "default",
              opacity: hasSelection ? 1 : 0.45,
              whiteSpace: "nowrap",
              lineHeight: 1.5,
            }}
          >
            {snippetStatus === "saving" ? "Saving…" : snippetStatus === "saved" ? "Snippet saved ✓" : "Set as Snippet"}
          </button>
          {(snippetLen ?? 0) > 0 && snippetStatus === "idle" && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic", alignSelf: "center" }}>
              snippet: {snippetLen} chars
            </span>
          )}
        </>
      )}

      {/* Remove Highlights + Search — pushed to right */}
      <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem", alignItems: "center" }}>
        <button
          type="button"
          title="Remove all highlights from this chapter"
          disabled={!editor}
          onMouseDown={(e) => {
            e.preventDefault();
            if (editor) removeAllHighlights(editor);
          }}
          style={{
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "3px",
            padding: "0.2rem 0.55rem",
            color: editor ? "var(--color-ink-muted)" : "var(--color-ink-faint)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.82rem",
            letterSpacing: "0.04em",
            cursor: editor ? "pointer" : "default",
            lineHeight: 1.5,
            opacity: editor ? 1 : 0.4,
          }}
        >
          ✦×
        </button>
        <button
          type="button"
          title="Search (⌘F)"
          onClick={onToggleSearch}
          style={{
            background: searchActive ? "rgba(201,168,76,0.12)" : "transparent",
            border: `1px solid ${searchActive ? "var(--color-gold-dim)" : "var(--color-border)"}`,
            borderRadius: "3px",
            padding: "0.2rem 0.55rem",
            color: searchActive ? "var(--color-gold)" : "var(--color-ink-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "1rem",
            cursor: "pointer",
            lineHeight: 1.5,
          }}
        >
          🔍
        </button>
      </div>
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────

function SearchBar({
  query,
  onQueryChange,
  total,
  current,
  onNext,
  onPrev,
  onClose,
  inputRef,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  total: number;
  current: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Enter") { e.shiftKey ? onPrev() : onNext(); }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.4rem 0.75rem",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderTop: "none",
        borderRadius: "0 0 4px 4px",
        flexWrap: "wrap",
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Search…"
        style={{
          flex: "1 1 140px",
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "3px",
          padding: "0.3rem 0.6rem",
          color: "var(--color-ink)",
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
          outline: "none",
          minWidth: "120px",
        }}
      />

      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.78rem",
          color: total === 0 && query ? "#d4848e" : "var(--color-ink-faint)",
          whiteSpace: "nowrap",
          minWidth: "4rem",
        }}
      >
        {query ? (total === 0 ? "No matches" : `${current + 1} of ${total}`) : ""}
      </span>

      {["←", "→"].map((arrow, i) => (
        <button
          key={arrow}
          type="button"
          title={i === 0 ? "Previous match (Shift+Enter)" : "Next match (Enter)"}
          onClick={i === 0 ? onPrev : onNext}
          disabled={total === 0}
          style={{
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "3px",
            padding: "0.2rem 0.55rem",
            color: "var(--color-ink-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            cursor: total === 0 ? "default" : "pointer",
            opacity: total === 0 ? 0.35 : 1,
          }}
        >
          {arrow}
        </button>
      ))}

      <button
        type="button"
        title="Close search (Esc)"
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--color-ink-faint)",
          fontFamily: "var(--font-body)",
          fontSize: "1rem",
          cursor: "pointer",
          padding: "0 0.25rem",
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── ChapterSection ────────────────────────────────────────────────────────────

type ChapterSectionHandle = {
  scrollIntoView: () => void;
  editor: Editor | null;
  getContent: () => string | null;
};

const ChapterSection = forwardRef<
  ChapterSectionHandle,
  {
    chapter: ChapterData;
    workId: string;
    onFocus: (editor: Editor, chapterId: string) => void;
    onWordCount: (chapterId: string, count: number) => void;
    onContentSaved: (chapterId: string, html: string) => void;
    chapterNumber: number;
    flags: FlagData[];
  }
>(({ chapter, workId, onFocus, onWordCount, onContentSaved, chapterNumber, flags }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flagsRef = useRef<FlagData[]>(flags);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [relTimeStr, setRelTimeStr] = useState("");

  const doSave = useCallback(
    async (html: string) => {
      setSaveStatus("saving");
      try {
        await saveChapterContent(chapter.id, workId, html);
        setSavedAt(new Date());
        setSaveStatus("saved");
        onContentSaved(chapter.id, html);
      } catch {
        setSaveStatus("idle");
      }
    },
    [chapter.id, workId, onContentSaved]
  );

  const chapterId = chapter.id;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      SearchExtension,
      Extension.create({
        name: "editorFlags",
        addProseMirrorPlugins: () => [makeFlagPlugin(chapterId, flagsRef)],
      }),
    ],
    content: chapter.content || "",
    immediatelyRender: false,
    onFocus: ({ editor }) => onFocus(editor, chapter.id),
    onUpdate: ({ editor }) => {
      onWordCount(chapter.id, countWords(editor.getText()));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSave(editor.getHTML()), 1500);
    },
  });

  // Keep flagsRef in sync and trigger redecoration
  useEffect(() => {
    flagsRef.current = flags.filter((f) => f.chapterId === chapter.id);
    if (editor) {
      editor.view.dispatch(editor.state.tr.setMeta(flagPluginKey, "update"));
    }
  }, [flags, editor, chapter.id]);

  useEffect(() => {
    if (editor) onWordCount(chapter.id, countWords(editor.getText()));
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    if (!savedAt) return;
    setRelTimeStr(relativeTime(savedAt));
    const id = setInterval(() => setRelTimeStr(relativeTime(savedAt)), 15_000);
    return () => clearInterval(id);
  }, [savedAt]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const id = setTimeout(() => setSaveStatus("idle"), 3000);
    return () => clearTimeout(id);
  }, [saveStatus]);

  useImperativeHandle(ref, () => ({
    scrollIntoView: () =>
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    editor: editor ?? null,
    getContent: () => editor?.getHTML() ?? null,
  }));

  const statusText =
    saveStatus === "saving" ? "Saving…" :
    saveStatus === "saved" ? "Saved ✓" :
    savedAt ? relTimeStr : "";

  return (
    <div ref={containerRef} style={{ marginBottom: "3rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.75rem",
          marginBottom: "1rem",
          paddingBottom: "0.6rem",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-ink-faint)", flexShrink: 0 }}>
          {chapterNumber}
        </span>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 400, color: "var(--color-ink)", letterSpacing: "0.04em", margin: 0, flex: 1 }}>
          {chapter.title}
        </h3>
        {statusText && (
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: saveStatus === "saved" ? "#8bc98d" : "var(--color-ink-faint)", fontStyle: "italic", flexShrink: 0 }}>
            {statusText}
          </span>
        )}
      </div>

      <div
        style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "2rem 2.5rem", cursor: "text", minHeight: "200px" }}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} className="tiptap-writing-area" />
      </div>
    </div>
  );
});
ChapterSection.displayName = "ChapterSection";

// ── ReadFullStory ─────────────────────────────────────────────────────────────

function ReadFullStory({
  title,
  chapters,
  flags,
  onFlagCreate,
  onFlagDelete,
  onClose,
}: {
  title: string;
  chapters: ChapterData[];
  flags: FlagData[];
  onFlagCreate: (chapterId: string, fromOffset: number, toOffset: number, snippet: string, color: "yellow" | "red") => void;
  onFlagDelete: (flagId: string) => void;
  onClose: () => void;
}) {
  const pushedHistory = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [showFlags, setShowFlags] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCurrent, setSearchCurrent] = useState(0);
  const [searchTotal, setSearchTotal] = useState(0);
  const [processedHtmls, setProcessedHtmls] = useState<string[]>(
    chapters.map((c) => c.content ?? "")
  );

  // DOM selection state for flag creation
  const [fsSelection, setFsSelection] = useState<{
    chapterId: string;
    fromOffset: number;
    toOffset: number;
    snippet: string;
  } | null>(null);

  useEffect(() => {
    setProcessedHtmls(chapters.map((c) => c.content ?? ""));
  }, [chapters]);

  // Browser history for Back button
  useEffect(() => {
    window.history.pushState({ castalia_popup: "read_full_story" }, "");
    pushedHistory.current = true;
    function handlePop() {
      if (pushedHistory.current) { pushedHistory.current = false; onClose(); }
    }
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showSearch) closeSearch();
        else doClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        openSearch();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // Track DOM selection for flag creation
  useEffect(() => {
    function handleSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setFsSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const snippet = sel.toString().trim();
      if (!snippet) { setFsSelection(null); return; }

      const chapterDiv = findChapterContainer(range.startContainer);
      if (!chapterDiv) { setFsSelection(null); return; }
      const chapterId = chapterDiv.dataset.chapterId;
      if (!chapterId) { setFsSelection(null); return; }

      const fromOffset = getDomTextOffset(chapterDiv, range.startContainer, range.startOffset);
      const toOffset = getDomTextOffset(chapterDiv, range.endContainer, range.endOffset);

      setFsSelection({ chapterId, fromOffset, toOffset, snippet: snippet.slice(0, 100) });
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // Rebuild processed HTML whenever query, current match, flags, or showFlags changes
  useEffect(() => {
    let htmls = chapters.map((c) => {
      let html = c.content ?? "";
      if (showFlags) html = injectAllFlagMarks(html, flags, c.id);
      return html;
    });

    if (searchQuery.trim()) {
      let offset = 0;
      htmls = htmls.map((html) => {
        const { html: marked, count } = injectSearchMarks(html, searchQuery, searchCurrent, offset);
        offset += count;
        if (offset > searchTotal || (searchTotal === 0 && count > 0)) {
          // will be reconciled below
        }
        return marked;
      });

      // Recount total
      let total = 0;
      chapters.forEach((c) => {
        let html = c.content ?? "";
        if (showFlags) html = injectAllFlagMarks(html, flags, c.id);
        const { count } = injectSearchMarks(html, searchQuery, -1, 0);
        total += count;
      });
      setSearchTotal(total);
    } else {
      setSearchTotal(0);
    }

    setProcessedHtmls(htmls);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchCurrent, showFlags, flags, chapters]);

  // Scroll to current search match
  useEffect(() => {
    if (!searchQuery) return;
    setTimeout(() => {
      document.getElementById("fs-search-current")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 50);
  }, [processedHtmls, searchQuery]);

  function openSearch() {
    setShowSearch(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setShowSearch(false);
    setSearchQuery("");
    setSearchCurrent(0);
  }

  function handleNext() {
    setSearchCurrent((c) => searchTotal > 0 ? (c + 1) % searchTotal : 0);
  }

  function handlePrev() {
    setSearchCurrent((c) => searchTotal > 0 ? (c - 1 + searchTotal) % searchTotal : 0);
  }

  function doClose() {
    if (pushedHistory.current) { pushedHistory.current = false; window.history.back(); }
    else onClose();
  }

  function handleFlagBtn(color: "yellow" | "red") {
    if (!fsSelection) return;
    onFlagCreate(
      fsSelection.chapterId,
      fsSelection.fromOffset,
      fsSelection.toOffset,
      fsSelection.snippet,
      color
    );
    window.getSelection()?.removeAllRanges();
    setFsSelection(null);
  }

  const flagBtnBase: React.CSSProperties = {
    background: "transparent",
    border: "1px solid var(--color-border)",
    borderRadius: "3px",
    padding: "0.3rem 0.55rem",
    fontFamily: "var(--font-body)",
    fontSize: "0.9rem",
    cursor: "pointer",
    lineHeight: 1.5,
    transition: "border-color 0.15s, background 0.15s",
  };

  // Count flags for this work in full story view
  const flagCount = flags.length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "var(--color-bg)", overflowY: "auto" }}>
      {/* Header bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "var(--color-bg-surface)",
          borderBottom: "1px solid var(--color-border)",
          zIndex: 1,
        }}
      >
        {/* Title row */}
        <div style={{ padding: "0.7rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-ink-muted)", letterSpacing: "0.04em" }}>
            {title}
          </span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Flag creation buttons — shown when text is selected */}
            {fsSelection && (
              <>
                <button type="button" title="Yellow flag — revisit this" onClick={() => handleFlagBtn("yellow")} style={{ ...flagBtnBase, color: "var(--color-gold)" }}>
                  🚩 Revisit
                </button>
                <button type="button" title="Red flag — urgent fix" onClick={() => handleFlagBtn("red")} style={{ ...flagBtnBase, color: "#d4848e" }}>
                  🔴 Urgent
                </button>
                <div style={{ width: "1px", height: "18px", background: "var(--color-border)" }} />
              </>
            )}
            {/* Show/hide flags toggle */}
            <button
              type="button"
              title={showFlags ? "Hide flags" : "Show flags"}
              onClick={() => setShowFlags((v) => !v)}
              style={{
                ...flagBtnBase,
                background: showFlags ? "rgba(201,168,76,0.08)" : "transparent",
                border: `1px solid ${showFlags ? "var(--color-gold-dim)" : "var(--color-border)"}`,
                color: showFlags ? "var(--color-gold)" : "var(--color-ink-faint)",
                fontSize: "0.78rem",
                letterSpacing: "0.04em",
                padding: "0.3rem 0.65rem",
              }}
            >
              {showFlags ? `🚩 ${flagCount}` : "Flags hidden"}
            </button>
            {/* Search */}
            <button
              type="button"
              title="Search (⌘F)"
              onClick={() => showSearch ? closeSearch() : openSearch()}
              style={{
                ...flagBtnBase,
                background: showSearch ? "rgba(201,168,76,0.12)" : "transparent",
                border: `1px solid ${showSearch ? "var(--color-gold-dim)" : "var(--color-border)"}`,
                color: showSearch ? "var(--color-gold)" : "var(--color-ink-muted)",
                fontSize: "1rem",
              }}
            >
              🔍
            </button>
            <button
              type="button"
              onClick={doClose}
              style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.35rem 0.9rem", color: "var(--color-ink-muted)", fontFamily: "var(--font-body)", fontSize: "0.88rem", cursor: "pointer" }}
            >
              ← Back to editor
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div style={{ padding: "0 1.5rem 0.6rem" }}>
            <SearchBar
              query={searchQuery}
              onQueryChange={(q) => { setSearchQuery(q); setSearchCurrent(0); }}
              total={searchTotal}
              current={searchCurrent}
              onNext={handleNext}
              onPrev={handlePrev}
              onClose={closeSearch}
              inputRef={searchInputRef}
            />
          </div>
        )}

        {/* Formatting toolbar */}
        <div
          style={{
            padding: "0.4rem 1.5rem",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-bg)",
          }}
        >
          <EditorToolbar
            editor={null}
            onToggleSearch={() => showSearch ? closeSearch() : openSearch()}
            searchActive={showSearch}
          />
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} style={{ maxWidth: "680px", margin: "0 auto", padding: "clamp(2rem, 5vw, 4rem) 1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 400, color: "var(--color-ink)", letterSpacing: "0.04em", marginBottom: "3rem", textAlign: "center" }}>
          {title}
        </h1>

        {chapters.map((ch, i) => (
          <div key={ch.id} style={{ marginBottom: "3.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 400, color: "var(--color-ink)", letterSpacing: "0.04em", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--color-border)" }}>
              {ch.title}
            </h2>
            {processedHtmls[i] ? (
              // data-chapter-id allows DOM selection to identify which chapter the user selected in
              <div
                data-chapter-id={ch.id}
                className="tiptap-writing-area tiptap-readonly"
                dangerouslySetInnerHTML={{ __html: processedHtmls[i] }}
                style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem", lineHeight: 1.85, color: "var(--color-ink-muted)", paddingLeft: "1.2rem" }}
              />
            ) : (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>(empty)</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ChapterPanel ──────────────────────────────────────────────────────────────

function ChapterPanel({
  chapters,
  wordCounts,
  workId,
  onAdd,
  onRename,
  onDeleteRequest,
  onJump,
  onReorder,
}: {
  chapters: ChapterData[];
  wordCounts: Record<string, number>;
  workId: string;
  onAdd: () => void;
  onRename: (id: string, title: string) => void;
  onDeleteRequest: (id: string) => void;
  onJump: (id: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function startEdit(ch: ChapterData) { setEditingId(ch.id); setEditValue(ch.title); }
  function commitEdit(id: string) { if (editValue.trim()) onRename(id, editValue.trim()); setEditingId(null); }

  function handleDragStart(e: React.DragEvent, id: string) { setDraggedId(id); e.dataTransfer.effectAllowed = "move"; }
  function handleDragOver(e: React.DragEvent, id: string) { e.preventDefault(); if (id !== draggedId) setDragOverId(id); }
  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    const ids = chapters.map((c) => c.id);
    const fi = ids.indexOf(draggedId), ti = ids.indexOf(targetId);
    const reordered = [...ids];
    reordered.splice(fi, 1);
    reordered.splice(ti, 0, draggedId);
    onReorder(reordered);
    setDraggedId(null); setDragOverId(null);
  }

  const iconBtn: React.CSSProperties = { background: "transparent", border: "none", cursor: "pointer", padding: "0.2rem 0.3rem", color: "var(--color-ink-faint)", fontFamily: "var(--font-body)", fontSize: "0.82rem", lineHeight: 1, borderRadius: "3px", flexShrink: 0 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {chapters.map((ch, idx) => {
          const wc = wordCounts[ch.id] ?? 0;
          const isEditing = editingId === ch.id;
          const isDragOver = dragOverId === ch.id;

          return (
            <div
              key={ch.id}
              draggable
              onDragStart={(e) => handleDragStart(e, ch.id)}
              onDragOver={(e) => handleDragOver(e, ch.id)}
              onDrop={(e) => handleDrop(e, ch.id)}
              onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.6rem", borderRadius: "3px", background: isDragOver ? "rgba(201,168,76,0.08)" : "transparent", borderLeft: isDragOver ? "2px solid var(--color-gold-dim)" : "2px solid transparent", cursor: "grab", opacity: draggedId === ch.id ? 0.4 : 1, transition: "background 0.1s, border-color 0.1s" }}
            >
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", flexShrink: 0, minWidth: "1.2rem", textAlign: "right" }}>
                {idx + 1}
              </span>
              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(ch.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(ch.id); if (e.key === "Escape") setEditingId(null); }}
                  style={{ flex: 1, background: "var(--color-bg)", border: "1px solid var(--color-gold-dim)", borderRadius: "2px", padding: "0.15rem 0.4rem", color: "var(--color-ink)", fontFamily: "var(--font-body)", fontSize: "0.88rem", outline: "none" }}
                />
              ) : (
                <button type="button" onClick={() => onJump(ch.id)} title="Jump to chapter"
                  style={{ background: "transparent", border: "none", cursor: "pointer", flex: 1, textAlign: "left", padding: "0 0.2rem", fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.4, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ch.title}
                </button>
              )}
              {!isEditing && wc > 0 && (
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", color: "var(--color-ink-faint)", flexShrink: 0 }}>
                  {wc.toLocaleString()}w
                </span>
              )}
              <button type="button" title="Rename chapter" onClick={() => startEdit(ch)} style={iconBtn}>✎</button>
              <button type="button" title="Delete chapter" onClick={() => onDeleteRequest(ch.id)} style={{ ...iconBtn, color: "var(--color-crimson-dim)" }}>✕</button>
            </div>
          );
        })}
      </div>

      <div style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
        <button
          type="button"
          onClick={onAdd}
          style={{ width: "100%", background: "transparent", border: "1px dashed var(--color-border)", borderRadius: "3px", padding: "0.5rem", color: "var(--color-gold)", fontFamily: "var(--font-body)", fontSize: "0.82rem", letterSpacing: "0.06em", cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-gold-dim)"; e.currentTarget.style.background = "rgba(201,168,76,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.background = "transparent"; }}
        >
          + Add Chapter
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WritingEditor({
  workId,
  title,
  workType,
  initialChapters,
  savedSnippet,
  backHref,
  initialFlags,
}: {
  workId: string;
  title: string;
  workType: string;
  initialChapters: ChapterData[];
  savedSnippet?: string | null;
  backHref: string;
  initialFlags: FlagData[];
}) {
  const router = useRouter();

  const [chapters, setChapters] = useState<ChapterData[]>(initialChapters);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showFullStory, setShowFullStory] = useState(false);
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [snippetStatus, setSnippetStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [currentSnippetLen, setCurrentSnippetLen] = useState(savedSnippet?.length ?? 0);

  // Flags state
  const [flags, setFlags] = useState<FlagData[]>(initialFlags);

  // Live chapter content — updated when each chapter auto-saves
  const handleContentSaved = useCallback((chapterId: string, html: string) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, content: html } : c))
    );
  }, []);

  // Snapshot of chapters passed to ReadFullStory (captures live editor content at open time)
  const [storyChapters, setStoryChapters] = useState<ChapterData[]>([]);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchCurrent, setSearchCurrent] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sectionRefs = useRef<Map<string, ChapterSectionHandle>>(new Map());
  const totalWords = Object.values(wordCounts).reduce((s, n) => s + n, 0);

  const toolbarMarks = useEditorState({
    editor: activeEditor,
    selector: (ctx) => ({
      hasSelection: (ctx.editor?.state.selection.from ?? 0) !== (ctx.editor?.state.selection.to ?? 0),
    }),
  });

  const handleWordCount = useCallback((id: string, count: number) => {
    setWordCounts((prev) => ({ ...prev, [id]: count }));
  }, []);

  const handleFocus = useCallback((editor: Editor, chapterId: string) => {
    setActiveEditor(editor);
    setActiveChapterId(chapterId);
  }, []);

  // Apply search across ALL chapter editors simultaneously.
  // Each editor shows all its matches; the globally-current match gets
  // search-match--current and is scrolled into view.
  useEffect(() => {
    if (!showSearch || !searchQuery.trim()) {
      // Clear every editor
      chapters.forEach((ch) => {
        const h = sectionRefs.current.get(ch.id);
        if (h?.editor) clearEditorSearch(h.editor);
      });
      setSearchTotal(0);
      return;
    }

    let total = 0;
    let globalOffset = 0;

    for (const ch of chapters) {
      const handle = sectionRefs.current.get(ch.id);
      if (!handle?.editor) continue;
      const ed = handle.editor;
      const matches = findDocMatches(ed.state.doc, searchQuery);

      if (!matches.length) {
        clearEditorSearch(ed);
        continue;
      }

      const localIdx = searchCurrent - globalOffset;
      const isCurrent = localIdx >= 0 && localIdx < matches.length;

      ed.view.dispatch(
        ed.state.tr.setMeta(searchPluginKey, {
          query: searchQuery,
          matches,
          currentIdx: isCurrent ? localIdx : -1,
        })
      );

      if (isCurrent && matches[localIdx]) {
        const m = matches[localIdx];
        ed.commands.setTextSelection({ from: m.from, to: m.to });
        handle.scrollIntoView();
        setTimeout(() => {
          ed.view.dom
            .querySelector(".search-match--current")
            ?.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 50);
      }

      globalOffset += matches.length;
      total += matches.length;
    }

    setSearchTotal(total);
    if (searchCurrent >= total && total > 0) setSearchCurrent(total - 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSearch, searchQuery, searchCurrent, chapters]);

  // Ctrl/Cmd+F
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        openSearch();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  function openSearch() {
    setShowSearch(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setShowSearch(false);
    setSearchQuery("");
    setSearchCurrent(0);
    setSearchTotal(0);
    chapters.forEach((ch) => {
      const h = sectionRefs.current.get(ch.id);
      if (h?.editor) clearEditorSearch(h.editor);
    });
  }

  function handleSearchQueryChange(q: string) {
    setSearchQuery(q);
    setSearchCurrent(0);
  }

  function handleNext() {
    setSearchCurrent((c) => searchTotal > 0 ? (c + 1) % searchTotal : 0);
  }

  function handlePrev() {
    setSearchCurrent((c) => searchTotal > 0 ? (c - 1 + searchTotal) % searchTotal : 0);
  }

  // ── Flag operations ─────────────────────────────────────────────────────────

  async function handleFlagCreate(
    chapterId: string,
    fromOffset: number,
    toOffset: number,
    snippet: string,
    color: "yellow" | "red"
  ) {
    const result = await createFlag(workId, chapterId, color, fromOffset, toOffset, snippet);
    if ("flag" in result && result.flag) {
      setFlags((prev) => [
        ...prev,
        { ...result.flag, createdAt: result.flag.createdAt.toString() },
      ]);
    }
  }

  async function handleFlagCreateFromEditor(color: "yellow" | "red") {
    if (!activeEditor || !activeChapterId) return;
    const { from, to } = activeEditor.state.selection;
    if (from === to) return;
    const fromOffset = docPosToTextOffset(activeEditor.state.doc, from);
    const toOffset = docPosToTextOffset(activeEditor.state.doc, to);
    const snippet = activeEditor.state.doc.textBetween(from, to, " ").slice(0, 100).trim();
    if (!snippet) return;
    await handleFlagCreate(activeChapterId, fromOffset, toOffset, snippet, color);
  }

  async function handleFlagDelete(flagId: string) {
    await deleteFlag(flagId, workId);
    setFlags((prev) => prev.filter((f) => f.id !== flagId));
  }

  function handleFlagJump(flag: FlagData) {
    const sectionHandle = sectionRefs.current.get(flag.chapterId);
    if (!sectionHandle) return;
    sectionHandle.scrollIntoView();
    setTimeout(() => {
      const editor = sectionHandle.editor;
      if (!editor) return;
      const from = textOffsetToDocPos(editor.state.doc, flag.fromOffset);
      const to = textOffsetToDocPos(editor.state.doc, flag.toOffset);
      editor.chain().focus().setTextSelection({ from, to }).run();
      setTimeout(() => {
        editor.view.dispatch(editor.state.tr.scrollIntoView());
      }, 50);
    }, 300);
  }

  // ── Chapter operations ──────────────────────────────────────────────────────

  async function handleAddChapter() {
    const result = await createChapter(workId);
    if (result.error || !result.id) return;
    const newChapter: ChapterData = { id: result.id, title: `Chapter ${chapters.length + 1}`, content: null, order: chapters.length };
    setChapters((prev) => [...prev, newChapter]);
    setTimeout(() => sectionRefs.current.get(result.id!)?.scrollIntoView(), 200);
  }

  async function handleRename(id: string, newTitle: string) {
    await renameChapter(id, workId, newTitle);
    setChapters((prev) => prev.map((c) => c.id === id ? { ...c, title: newTitle } : c));
  }

  async function handleDeleteConfirmed() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    await deleteChapter(id, workId);
    setChapters((prev) => prev.filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i })));
    setWordCounts((prev) => { const next = { ...prev }; delete next[id]; return next; });
    sectionRefs.current.delete(id);
    // Remove flags for the deleted chapter (they cascade in DB, mirror client-side)
    setFlags((prev) => prev.filter((f) => f.chapterId !== id));
  }

  async function handleReorder(orderedIds: string[]) {
    const idToChapter = new Map(chapters.map((c) => [c.id, c]));
    setChapters(orderedIds.map((id, i) => ({ ...idToChapter.get(id)!, order: i })));
    await reorderChapters(workId, orderedIds);
  }

  function handleJump(id: string) { sectionRefs.current.get(id)?.scrollIntoView(); }

  function openFullStory() {
    // Snapshot live editor content so ReadFullStory shows what's actually typed,
    // not only what's been auto-saved to the DB.
    const live = chapters.map((ch) => {
      const handle = sectionRefs.current.get(ch.id);
      return { ...ch, content: handle?.getContent() ?? ch.content };
    });
    setStoryChapters(live);
    setShowFullStory(true);
  }

  async function handleSetSnippet() {
    if (!activeEditor) return;
    const { from, to } = activeEditor.state.selection;
    if (from === to) return;
    const text = activeEditor.state.doc.textBetween(from, to, "\n\n");
    if (!text.trim()) return;
    setSnippetStatus("saving");
    const result = await updateSnippet(workId, text);
    if (!result?.error) {
      setCurrentSnippetLen(text.trim().length);
      setSnippetStatus("saved");
      setTimeout(() => setSnippetStatus("idle"), 3000);
    } else {
      setSnippetStatus("idle");
    }
  }

  const chapterToDelete = chapters.find((c) => c.id === confirmDeleteId);
  const hasSelection = toolbarMarks?.hasSelection ?? false;

  // Build flag list sorted by chapter order then by position
  const chapterOrder = new Map(chapters.map((c, i) => [c.id, i]));
  const sortedFlags = [...flags].sort((a, b) => {
    const chDiff = (chapterOrder.get(a.chapterId) ?? 0) - (chapterOrder.get(b.chapterId) ?? 0);
    if (chDiff !== 0) return chDiff;
    return a.fromOffset - b.fromOffset;
  });

  const flagBtnStyle = (color: "yellow" | "red", active: boolean): React.CSSProperties => ({
    background: active ? (color === "yellow" ? "rgba(201,168,76,0.15)" : "rgba(180,40,40,0.15)") : "transparent",
    border: `1px solid ${active ? (color === "yellow" ? "var(--color-gold-dim)" : "var(--color-crimson-dim)") : "var(--color-border)"}`,
    borderRadius: "3px",
    padding: "0.3rem 0.6rem",
    color: active ? (color === "yellow" ? "var(--color-gold)" : "#d4848e") : (hasSelection ? "var(--color-ink-muted)" : "var(--color-ink-faint)"),
    fontFamily: "var(--font-body)",
    fontSize: "0.85rem",
    cursor: hasSelection ? "pointer" : "default",
    opacity: hasSelection ? 1 : 0.4,
    whiteSpace: "nowrap" as const,
    transition: "border-color 0.15s, background 0.15s",
  });

  return (
    <>
      {/* Outer container fills the admin's content area and manages its own scroll,
          so the header, toolbar and right panel can all stay permanently visible. */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* ── Top header (always visible) ── */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", paddingBottom: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <button type="button" onClick={() => router.push(backHref)}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-faint)", padding: 0, marginBottom: "0.4rem", display: "block" }}>
              ← {title}
            </button>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 400, color: "var(--color-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
              {title}
            </h2>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-faint)" }}>
              {workType}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingTop: "1.6rem", flexShrink: 0 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
              {totalWords.toLocaleString()} {totalWords === 1 ? "word" : "words"} total
            </span>
            <button type="button" onClick={() => setPanelOpen((o) => !o)}
              style={{ background: panelOpen ? "rgba(201,168,76,0.08)" : "transparent", border: `1px solid ${panelOpen ? "var(--color-gold-dim)" : "var(--color-border)"}`, borderRadius: "3px", padding: "0.3rem 0.75rem", color: panelOpen ? "var(--color-gold)" : "var(--color-ink-muted)", fontFamily: "var(--font-body)", fontSize: "0.82rem", letterSpacing: "0.04em", cursor: "pointer", whiteSpace: "nowrap" }}>
              {panelOpen ? "Chapters ›" : "‹ Chapters"}
            </button>
          </div>
        </div>

        {/* ── Toolbar (always visible) ── */}
        <div
          style={{
            flexShrink: 0,
            background: "var(--color-bg)",
            borderTop: "1px solid var(--color-border)",
            borderBottom: showSearch ? "none" : "1px solid var(--color-border)",
            padding: "0.45rem 0",
          }}
        >
          <EditorToolbar
            editor={activeEditor}
            onSnippet={handleSetSnippet}
            snippetStatus={snippetStatus}
            snippetLen={currentSnippetLen}
            hasSelection={hasSelection}
            onToggleSearch={() => showSearch ? closeSearch() : openSearch()}
            searchActive={showSearch}
          />
        </div>

        {/* ── Search bar (always visible when open) ── */}
        {showSearch && (
          <div style={{ flexShrink: 0 }}>
            <SearchBar
              query={searchQuery}
              onQueryChange={handleSearchQueryChange}
              total={searchTotal}
              current={searchCurrent}
              onNext={handleNext}
              onPrev={handlePrev}
              onClose={closeSearch}
              inputRef={searchInputRef}
            />
          </div>
        )}

        {/* ── Scrollable body ── writing area + right panel scroll together; right panel sticks within this container */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", gap: "1.5rem", alignItems: "flex-start", paddingTop: "1.5rem" }}>
          {/* Writing area */}
          <div style={{ flex: "1 1 0", minWidth: 0 }}>
            {chapters.map((ch, idx) => (
              <ChapterSection
                key={ch.id}
                ref={(el) => { if (el) sectionRefs.current.set(ch.id, el); else sectionRefs.current.delete(ch.id); }}
                chapter={ch}
                workId={workId}
                chapterNumber={idx + 1}
                onFocus={handleFocus}
                onWordCount={handleWordCount}
                onContentSaved={handleContentSaved}
                flags={flags}
              />
            ))}
            {chapters.length > 1 && (
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
                  Total: {totalWords.toLocaleString()} {totalWords === 1 ? "word" : "words"} across {chapters.length} chapters
                </span>
              </div>
            )}
          </div>

          {/* Right panel */}
          {panelOpen && (
            <div style={{ flexShrink: 0, width: "250px", position: "sticky", top: 0, maxHeight: "100%", overflowY: "auto", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

              {/* ── Flag buttons ── */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  title={hasSelection ? "Yellow flag — mark for revisit" : "Select text first"}
                  disabled={!hasSelection}
                  onMouseDown={(e) => {
                    e.preventDefault(); // keep editor selection alive
                    if (hasSelection) handleFlagCreateFromEditor("yellow");
                  }}
                  style={flagBtnStyle("yellow", false)}
                >
                  <span style={{ color: "#c9a84c" }}>⚑</span> Revisit
                </button>
                <button
                  type="button"
                  title={hasSelection ? "Red flag — urgent fix needed" : "Select text first"}
                  disabled={!hasSelection}
                  onMouseDown={(e) => {
                    e.preventDefault(); // keep editor selection alive
                    if (hasSelection) handleFlagCreateFromEditor("red");
                  }}
                  style={flagBtnStyle("red", false)}
                >
                  <span style={{ color: "#8b2635" }}>⚑</span> Urgent
                </button>
              </div>

              {/* ── Flag list ── */}
              {sortedFlags.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-ink-faint)", margin: "0 0 0.4rem 0" }}>
                    Flags · {sortedFlags.length}
                  </p>
                  {sortedFlags.map((flag) => {
                    const chapterIdx = chapterOrder.get(flag.chapterId) ?? 0;
                    const chapterTitle = chapters[chapterIdx]?.title ?? "Unknown";
                    return (
                      <div
                        key={flag.id}
                        style={{ display: "flex", alignItems: "flex-start", gap: "0.3rem", padding: "0.4rem 0.3rem", borderRadius: "3px", borderBottom: "1px solid var(--color-border)" }}
                      >
                        <span style={{ fontSize: "0.7rem", flexShrink: 0, marginTop: "0.15rem" }}>
                          {flag.color === "yellow" ? "🚩" : "🔴"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFlagJump(flag)}
                          title="Jump to this flag"
                          style={{ background: "transparent", border: "none", cursor: "pointer", flex: 1, textAlign: "left", padding: 0, minWidth: 0 }}
                        >
                          <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "var(--color-ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.1rem" }}>
                            Ch{chapterIdx + 1} · {chapterTitle}
                          </span>
                          <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                            "{flag.snippet}"
                          </span>
                        </button>
                        <button
                          type="button"
                          title="Resolve / delete flag"
                          onClick={() => handleFlagDelete(flag.id)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-ink-faint)", fontFamily: "var(--font-body)", fontSize: "0.75rem", padding: "0 0.15rem", flexShrink: 0, lineHeight: 1, marginTop: "0.15rem" }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", fontStyle: "italic", margin: 0 }}>
                  No flags yet. Select text and click a flag button.
                </p>
              )}

              <div style={{ height: "1px", background: "var(--color-border)" }} />

              {/* ── Existing: Read Full Story + Chapter Panel ── */}
              <button type="button" onClick={openFullStory}
                style={{ width: "100%", background: "var(--color-crimson)", border: "none", borderRadius: "3px", padding: "0.6rem 0.75rem", color: "var(--color-ink)", fontFamily: "var(--font-heading)", fontSize: "0.95rem", letterSpacing: "0.06em", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#7a1f2e")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-crimson)")}
              >
                Read Full Story
              </button>
              <div style={{ height: "1px", background: "var(--color-border)" }} />
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-ink-faint)", margin: 0 }}>
                Chapters · {chapters.length}
              </p>
              <ChapterPanel
                chapters={chapters}
                wordCounts={wordCounts}
                workId={workId}
                onAdd={handleAddChapter}
                onRename={handleRename}
                onDeleteRequest={(id) => setConfirmDeleteId(id)}
                onJump={handleJump}
                onReorder={handleReorder}
              />
            </div>
          )}
        </div>
      </div>

      {showFullStory && (
        <ReadFullStory
          title={title}
          chapters={storyChapters}
          flags={flags}
          onFlagCreate={handleFlagCreate}
          onFlagDelete={handleFlagDelete}
          onClose={() => setShowFullStory(false)}
        />
      )}

      {confirmDeleteId && chapterToDelete && (
        <TwoStepDestroyConfirm
          firstWarningBody="You're about to destroy a chapter!!"
          itemName={chapterToDelete.title}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}
