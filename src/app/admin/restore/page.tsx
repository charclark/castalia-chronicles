"use client";

import { useRef, useState, useTransition } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkPreview = {
  kind: "work";
  title: string;
  type: string;
  hasContent: boolean;
  hasSnippet: boolean;
};

type UniversePreview = {
  kind: "universe";
  universeName: string;
  characters: number;
  relationships: number;
  locations: number;
  storylineIdeas: number;
  plotItems: number;
  notes: number;
  images: number;
};

type Preview = WorkPreview | UniversePreview | null;

// ── Styles ────────────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.6rem", display: "block",
};

const surface: React.CSSProperties = {
  background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
  borderRadius: "4px", padding: "1.5rem",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RestorePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview>(null);
  const [rawBackup, setRawBackup] = useState<unknown>(null);
  const [parseError, setParseError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<string>("");
  const [apiError, setApiError] = useState("");
  const [pending, startTransition] = useTransition();

  // ── Parse file ──────────────────────────────────────────────────────────────

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setPreview(null);
    setRawBackup(null);
    setParseError("");
    setConfirmed(false);
    setResult("");
    setApiError("");

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as Record<string, unknown>;

        if (json.castalia_backup === "work") {
          const w = json.work as Record<string, unknown> | undefined;
          if (!w) throw new Error("Invalid work backup: missing work object");
          setPreview({
            kind: "work",
            title: typeof w.title === "string" ? w.title : "(untitled)",
            type: typeof w.type === "string" ? w.type : "unknown",
            hasContent: typeof w.content === "string" && w.content.length > 0,
            hasSnippet: typeof w.snippet === "string" && w.snippet.length > 0,
          });
          setRawBackup(json);
        } else if (json.castalia_backup === "universe") {
          const chars = Array.isArray(json.characters) ? json.characters : [];
          const rels = Array.isArray(json.relationships) ? json.relationships : [];
          const locs = Array.isArray(json.locations) ? json.locations : [];
          const ideas = Array.isArray(json.storylineIdeas) ? json.storylineIdeas : [];
          const plot = Array.isArray(json.plotItems) ? json.plotItems : [];
          const nts = Array.isArray(json.notes) ? json.notes : [];
          const imgs = Array.isArray(json.images) ? json.images : [];
          const uni = json.universe as Record<string, unknown> | undefined;
          setPreview({
            kind: "universe",
            universeName: typeof uni?.name === "string" ? uni.name : "(unknown universe)",
            characters: chars.length,
            relationships: rels.length,
            locations: locs.length,
            storylineIdeas: ideas.length,
            plotItems: plot.length,
            notes: nts.length,
            images: imgs.length,
          });
          setRawBackup(json);
        } else {
          throw new Error("Unrecognised backup: expected castalia_backup = 'work' or 'universe'.");
        }
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  function handleRestore() {
    if (!rawBackup) return;
    setApiError("");
    setResult("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rawBackup),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          setApiError(typeof data.error === "string" ? data.error : "Restore failed.");
          return;
        }
        if (data.type === "work") {
          setResult(`Work "${data.title}" has been restored as a private draft.`);
        } else if (data.type === "universe") {
          const c = data.counts as Record<string, number>;
          const parts = [
            c.characters > 0 && `${c.characters} character${c.characters !== 1 ? "s" : ""}`,
            c.relationships > 0 && `${c.relationships} relationship${c.relationships !== 1 ? "s" : ""}`,
            c.locations > 0 && `${c.locations} location${c.locations !== 1 ? "s" : ""}`,
            c.storylineIdeas > 0 && `${c.storylineIdeas} idea${c.storylineIdeas !== 1 ? "s" : ""}`,
            c.plotItems > 0 && `${c.plotItems} plot item${c.plotItems !== 1 ? "s" : ""}`,
            c.notes > 0 && `${c.notes} note${c.notes !== 1 ? "s" : ""}`,
            c.images > 0 && `${c.images} image${c.images !== 1 ? "s" : ""}`,
          ].filter(Boolean);
          setResult(`Restored: ${parts.join(", ")}.`);
        }
        setPreview(null);
        setRawBackup(null);
        setConfirmed(false);
        if (fileRef.current) fileRef.current.value = "";
      } catch {
        setApiError("Network error — restore failed.");
      }
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: "640px" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.4rem" }}>
        Restore from Backup
      </h2>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2.5rem" }}>
        Upload a JSON backup file to restore a work or universe story bible.
        Data will be <strong style={{ color: "var(--color-ink-muted)", fontStyle: "normal" }}>added</strong> to the current universe — existing data is never overwritten.
      </p>

      {/* File input */}
      <div style={{ marginBottom: "2rem" }}>
        <span style={sectionLabel}>Backup File (.json)</span>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          style={{
            display: "block",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            color: "var(--color-ink-muted)",
            padding: "0.5rem 0",
            cursor: "pointer",
          }}
        />
      </div>

      {parseError && (
        <div style={{ background: "rgba(139,38,53,0.12)", border: "1px solid var(--color-crimson-dim)", borderRadius: "3px", padding: "0.8rem 1rem", color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          {parseError}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{ ...surface, marginBottom: "2rem" }}>
          <span style={sectionLabel}>Backup Preview</span>

          {preview.kind === "work" ? (
            <>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", color: "var(--color-ink)", marginBottom: "0.5rem" }}>
                Work: <em>{preview.title}</em>
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink-muted)", marginBottom: "0.3rem" }}>
                Type: {preview.type === "book" ? "Book" : "Short Story"}
              </p>
              {preview.hasContent && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink-muted)", marginBottom: "0.3rem" }}>✓ Contains written content</p>}
              {preview.hasSnippet && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink-muted)", marginBottom: "0.3rem" }}>✓ Contains public teaser / snippet</p>}
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginTop: "0.75rem" }}>
                Will be created as a private draft titled "{preview.title} (restored)".
              </p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", color: "var(--color-ink)", marginBottom: "0.75rem" }}>
                Universe Bible: <em>{preview.universeName}</em>
              </p>
              {(
                [
                  ["Characters", preview.characters],
                  ["Relationships", preview.relationships],
                  ["Locations", preview.locations],
                  ["Storyline Ideas", preview.storylineIdeas],
                  ["Plot Items", preview.plotItems],
                  ["Notes", preview.notes],
                  ["Images", preview.images],
                ] as [string, number][]
              ).map(([label, count]) => (
                <p key={label} style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: count > 0 ? "var(--color-ink-muted)" : "var(--color-ink-faint)", marginBottom: "0.2rem" }}>
                  {count > 0 ? "✓" : "–"} {label}: {count}
                </p>
              ))}
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginTop: "0.75rem" }}>
                All items will be added to your currently selected universe. Existing data is untouched.
              </p>
            </>
          )}

          {/* Confirmation checkbox */}
          <label
            style={{
              display: "flex", alignItems: "flex-start", gap: "0.65rem",
              marginTop: "1.25rem", cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink-muted)",
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: "0.15rem", accentColor: "var(--color-gold)", flexShrink: 0 }}
            />
            Yes, I want to restore this backup into the current universe.
          </label>

          {apiError && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#d4848e", marginTop: "0.75rem" }}>
              {apiError}
            </p>
          )}

          <button
            type="button"
            onClick={handleRestore}
            disabled={!confirmed || pending}
            style={{
              marginTop: "1rem",
              background: !confirmed || pending ? "var(--color-border)" : "var(--color-gold)",
              border: "none", borderRadius: "3px", padding: "0.65rem 1.5rem",
              color: !confirmed || pending ? "var(--color-ink-muted)" : "var(--color-bg)",
              fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.06em",
              cursor: !confirmed || pending ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {pending ? "Restoring…" : "Restore →"}
          </button>
        </div>
      )}

      {/* Success */}
      {result && (
        <div style={{ background: "rgba(76,139,64,0.1)", border: "1px solid rgba(76,139,64,0.35)", borderLeft: "3px solid #4c8b40", borderRadius: "4px", padding: "1rem 1.25rem" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#8bc98d" }}>
            ✓ Restore complete. {result}
          </p>
        </div>
      )}
    </div>
  );
}
