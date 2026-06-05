"use client";

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveWorkContent, updateSnippet } from "@/app/actions/works";

// ── Constants ─────────────────────────────────────────────────────────────────

const AUTOSAVE_DELAY_MS = 1500;

type SaveStatus = "idle" | "saving" | "saved";
type SnippetStatus = "idle" | "saving" | "saved";

// ── Helpers ───────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 15) return "Just saved";
  if (diff < 60) return `Saved ${diff}s ago`;
  const mins = Math.floor(diff / 60);
  return `Saved ${mins} min ago`;
}

// ── Toolbar button ────────────────────────────────────────────────────────────

function ToolbarButton({
  label,
  title,
  active,
  onClick,
}: {
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focused
        onClick();
      }}
      style={{
        background: active ? "rgba(201,168,76,0.12)" : "transparent",
        border: `1px solid ${active ? "var(--color-gold-dim)" : "var(--color-border)"}`,
        borderRadius: "3px",
        padding: "0.2rem 0.55rem",
        color: active ? "var(--color-gold)" : "var(--color-ink-muted)",
        fontFamily: "var(--font-heading)",
        fontSize: "0.82rem",
        letterSpacing: "0.04em",
        cursor: "pointer",
        lineHeight: 1.5,
        transition: "background 0.12s, border-color 0.12s, color 0.12s",
        minWidth: "32px",
        textAlign: "center",
      }}
    >
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WritingEditor({
  workId,
  title,
  workType,
  initialContent,
  savedSnippet,
  backHref,
}: {
  workId: string;
  title: string;
  workType: string;
  initialContent: string | null;
  savedSnippet?: string | null;
  backHref: string;
}) {
  const router = useRouter();

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [relTimeStr, setRelTimeStr] = useState("");
  const [wordCount, setWordCount] = useState(0);

  const [hasSelection, setHasSelection] = useState(false);
  const [snippetStatus, setSnippetStatus] = useState<SnippetStatus>("idle");
  const [currentSnippetLen, setCurrentSnippetLen] = useState<number>(
    savedSnippet?.length ?? 0
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Autosave ──────────────────────────────────────────────────────────────

  const doSave = useCallback(
    async (html: string) => {
      setSaveStatus("saving");
      try {
        await saveWorkContent(workId, html);
        setSavedAt(new Date());
        setSaveStatus("saved");
      } catch {
        setSaveStatus("idle");
      }
    },
    [workId]
  );

  // ── Snippet handler ───────────────────────────────────────────────────────

  async function handleSetSnippet() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, "\n\n");
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

  // ── TipTap editor ──────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Live word count
      setWordCount(countWords(editor.getText()));

      // Debounced autosave
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSave(editor.getHTML());
      }, AUTOSAVE_DELAY_MS);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      setHasSelection(from !== to);
    },
  });

  // Initial word count once editor is ready
  useEffect(() => {
    if (editor) {
      setWordCount(countWords(editor.getText()));
    }
  }, [editor]);

  // Cleanup debounce on unmount (flush any pending save)
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Relative-time ticker ─────────────────────────────────────────────────

  useEffect(() => {
    if (!savedAt) return;
    setRelTimeStr(relativeTime(savedAt));
    const id = setInterval(() => {
      setRelTimeStr(relativeTime(savedAt));
    }, 15_000);
    return () => clearInterval(id);
  }, [savedAt]);

  // Reset "saved" → "idle" after a short display
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const id = setTimeout(() => setSaveStatus("idle"), 3000);
    return () => clearTimeout(id);
  }, [saveStatus]);

  // ── Reactive toolbar state ────────────────────────────────────────────────

  const marks = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive("bold") ?? false,
      italic: ctx.editor?.isActive("italic") ?? false,
      h1: ctx.editor?.isActive("heading", { level: 1 }) ?? false,
      h2: ctx.editor?.isActive("heading", { level: 2 }) ?? false,
      h3: ctx.editor?.isActive("heading", { level: 3 }) ?? false,
      para: ctx.editor?.isActive("paragraph") ?? false,
    }),
  });

  // ── Save-status display ───────────────────────────────────────────────────

  const statusText =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved"
        : savedAt
          ? relTimeStr
          : "";

  const statusColor =
    saveStatus === "saving"
      ? "var(--color-ink-faint)"
      : saveStatus === "saved"
        ? "#8bc98d"
        : "var(--color-ink-faint)";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: "760px" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => router.push(backHref)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.88rem",
              color: "var(--color-ink-faint)",
              padding: 0,
              marginBottom: "0.6rem",
              display: "block",
            }}
          >
            ← {title}
          </button>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: 400,
              color: "var(--color-ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-ink-faint)",
            }}
          >
            {workType}
          </span>
        </div>

        {/* Word count + save status */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.2rem",
            paddingTop: "1.6rem",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.88rem",
              color: "var(--color-ink-muted)",
              letterSpacing: "0.02em",
            }}
          >
            {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              color: statusColor,
              fontStyle: "italic",
              minHeight: "1.1em",
              transition: "color 0.3s",
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--color-bg)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0.45rem 0",
          marginBottom: "0",
          display: "flex",
          gap: "0.35rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <ToolbarButton
          label="B"
          title="Bold (⌘B)"
          active={marks?.bold ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          title="Italic (⌘I)"
          active={marks?.italic ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />

        <div
          style={{ width: "1px", height: "18px", background: "var(--color-border)", margin: "0 0.15rem" }}
        />

        <ToolbarButton
          label="H1"
          title="Heading 1"
          active={marks?.h1 ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          label="H2"
          title="Heading 2"
          active={marks?.h2 ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="H3"
          title="Heading 3"
          active={marks?.h3 ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <ToolbarButton
          label="¶"
          title="Paragraph"
          active={marks?.para ?? false}
          onClick={() => editor?.chain().focus().setParagraph().run()}
        />

        <div style={{ width: "1px", height: "18px", background: "var(--color-border)", margin: "0 0.15rem" }} />

        {/* Set as Snippet — captures selected text as the public teaser */}
        <button
          type="button"
          title={
            hasSelection
              ? "Save selected text as the public snippet/teaser"
              : "Select text in the editor to set as public snippet"
          }
          onMouseDown={(e) => {
            e.preventDefault(); // keep editor focus and selection
            if (hasSelection && snippetStatus === "idle") {
              void handleSetSnippet();
            }
          }}
          disabled={!hasSelection || snippetStatus === "saving"}
          style={{
            background:
              snippetStatus === "saved"
                ? "rgba(201,168,76,0.12)"
                : "transparent",
            border: `1px solid ${
              snippetStatus === "saved"
                ? "var(--color-gold-dim)"
                : "var(--color-border)"
            }`,
            borderRadius: "3px",
            padding: "0.2rem 0.65rem",
            color:
              snippetStatus === "saved"
                ? "var(--color-gold)"
                : hasSelection
                  ? "var(--color-ink-muted)"
                  : "var(--color-ink-faint)",
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            letterSpacing: "0.04em",
            cursor: hasSelection && snippetStatus === "idle" ? "pointer" : "default",
            opacity: hasSelection ? 1 : 0.45,
            transition: "all 0.12s",
            whiteSpace: "nowrap",
            lineHeight: 1.5,
          }}
        >
          {snippetStatus === "saving"
            ? "Saving…"
            : snippetStatus === "saved"
              ? "Snippet saved ✓"
              : "Set as Snippet"}
        </button>

        {/* Snippet indicator — shown when a snippet is already saved */}
        {currentSnippetLen > 0 && snippetStatus === "idle" && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.72rem",
              color: "var(--color-ink-faint)",
              fontStyle: "italic",
              marginLeft: "0.35rem",
              alignSelf: "center",
            }}
          >
            snippet: {currentSnippetLen} chars
          </span>
        )}
      </div>

      {/* ── Editor surface ───────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          padding: "2.5rem 2.75rem",
          cursor: "text",
        }}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent
          editor={editor}
          className="tiptap-writing-area"
        />
      </div>
    </div>
  );
}
