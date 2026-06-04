"use client";

import { useActionState, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateCharacter,
  createCharacter,
  deleteCharacter,
  addRelationship,
  removeRelationship,
} from "@/app/actions/characters";

// ── Types ────────────────────────────────────────────────────────────────────

type CharacterData = {
  id: string;
  name: string;
  characterType: string;
  subtype: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  bodyType: string | null;
  attitude: string | null;
  quirks: string | null;
  speakingStyle: string | null;
  phrases: string | null;
  origin: string | null;
  livesIn: string | null;
  homeDescription: string | null;
  vehicles: string | null;
  jobs: string | null;
  pets: string | null;
  notes: string | null;
};

type Relationship = {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  type: string;
  note: string | null;
  fromCharacter: { id: string; name: string };
  toCharacter: { id: string; name: string };
};

type OtherCharacter = { id: string; name: string };

// ── Shared style helpers ─────────────────────────────────────────────────────

const fieldRow: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.75rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-ink-muted)",
};

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.6rem 0.8rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  outline: "none",
  width: "100%",
};

const taStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: "1.65",
};

const sectionHead: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "1.1rem",
  fontWeight: 400,
  color: "var(--color-gold)",
  letterSpacing: "0.06em",
  marginBottom: "0.9rem",
  paddingBottom: "0.4rem",
  borderBottom: "1px solid var(--color-border)",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1rem",
};

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "1rem",
};

const CHARACTER_TYPES = [
  "Vampire", "Human", "Wizard", "Werewolf", "Shapeshifter", "Ghost", "Other",
] as const;

const REL_TYPES = ["relative", "friend", "enemy"] as const;

const relBadge: Record<string, React.CSSProperties> = {
  relative: { background: "rgba(100,80,160,0.2)", color: "#c0a8f0", border: "1px solid rgba(100,80,160,0.4)" },
  friend:   { background: "rgba(60,130,80,0.2)",  color: "#8ec98d", border: "1px solid rgba(60,130,80,0.4)"  },
  enemy:    { background: "rgba(139,38,53,0.2)",  color: "#d4848e", border: "1px solid rgba(139,38,53,0.4)"  },
};

// ── Relationship row ─────────────────────────────────────────────────────────

function RelRow({
  rel,
  thisId,
  onRemove,
}: {
  rel: Relationship;
  thisId: string;
  onRemove: (id: string) => void;
}) {
  const other = rel.fromCharacterId === thisId ? rel.toCharacter : rel.fromCharacter;
  const badge = relBadge[rel.type] ?? {};

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
        padding: "0.55rem 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span
        style={{
          ...badge,
          fontFamily: "var(--font-body)",
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          textTransform: "capitalize",
          borderRadius: "2px",
          padding: "0.15rem 0.5rem",
          flexShrink: 0,
        }}
      >
        {rel.type}
      </span>
      <Link
        href={`/admin/characters/${other.id}`}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          color: "var(--color-ink)",
          textDecoration: "none",
          flex: 1,
        }}
      >
        {other.name}
      </Link>
      {rel.note && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            color: "var(--color-ink-faint)",
            fontStyle: "italic",
          }}
        >
          {rel.note}
        </span>
      )}
      <button
        onClick={() => onRemove(rel.id)}
        aria-label="Remove relationship"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-ink-faint)",
          fontSize: "0.75rem",
          padding: "0.2rem",
          opacity: 0.5,
          transition: "opacity 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
      >
        ✕
      </button>
    </div>
  );
}

// ── Add relationship form ────────────────────────────────────────────────────

function AddRelForm({
  thisId,
  allChars,
  onAdded,
}: {
  thisId: string;
  allChars: OtherCharacter[];
  onAdded: () => void;
}) {
  const [toId, setToId] = useState(allChars[0]?.id ?? "");
  const [type, setType] = useState<string>("friend");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function handleAdd() {
    if (!toId) return;
    setError("");
    start(async () => {
      const result = await addRelationship(thisId, toId, type, note);
      if (result.error) {
        setError(result.error);
      } else {
        setNote("");
        onAdded();
      }
    });
  }

  if (allChars.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
        No other characters in this universe yet.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "1rem" }}>
      {error && (
        <p style={{ color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>{error}</p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.6rem", alignItems: "end" }}>
        <div style={fieldRow}>
          <label style={labelStyle}>Character</label>
          <select value={toId} onChange={(e) => setToId(e.target.value)} style={inputStyle}>
            {allChars.map((c) => (
              <option key={c.id} value={c.id} style={{ background: "var(--color-bg-elevated)" }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={fieldRow}>
          <label style={labelStyle}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inputStyle, width: "110px" }}>
            {REL_TYPES.map((t) => (
              <option key={t} value={t} style={{ background: "var(--color-bg-elevated)" }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div style={fieldRow}>
          <label style={labelStyle}>Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. brother, rival"
            maxLength={100}
            style={{ ...inputStyle, width: "160px" }}
          />
        </div>
      </div>
      <div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending || !toId}
          style={{
            background: pending ? "var(--color-border)" : "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-light)",
            borderRadius: "3px",
            padding: "0.5rem 1rem",
            color: "var(--color-ink-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "0.88rem",
            cursor: pending ? "default" : "pointer",
          }}
        >
          {pending ? "Adding…" : "Add Relationship"}
        </button>
      </div>
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────────────────

export default function CharacterForm({
  character,
  allChars,
  relationships,
}: {
  character?: CharacterData;
  allChars: OtherCharacter[];
  relationships?: Relationship[];
}) {
  const router = useRouter();
  const isNew = !character;

  const saveAction = isNew ? createCharacter : updateCharacter;
  const [state, action, savePending] = useActionState(saveAction, null);
  const [deletePending, startDelete] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete "${character!.name}"? This cannot be undone.`)) return;
    startDelete(async () => {
      await deleteCharacter(character!.id);
    });
  }

  function handleRelRemove(relId: string) {
    if (!window.confirm("Remove this relationship?")) return;
    // Fire-and-forget, router.refresh() handles re-render
    removeRelationship(relId, character!.id).then(() => router.refresh());
  }

  return (
    <div style={{ maxWidth: "880px" }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "var(--font-body)", fontSize: "0.88rem",
          color: "var(--color-ink-faint)", padding: 0, marginBottom: "1.5rem",
        }}
      >
        ← Back
      </button>

      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
          fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem",
        }}
      >
        {isNew ? "New Character" : character.name}
      </h2>
      {!isNew && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2rem" }}>
          {character.characterType}{character.subtype ? ` · ${character.subtype}` : ""}
        </p>
      )}
      {isNew && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2rem" }}>
          Add a new character to this universe.
        </p>
      )}

      {/* Status */}
      {state?.error && (
        <div role="alert" style={{ background: "rgba(139,38,53,0.15)", border: "1px solid var(--color-crimson-dim)", borderRadius: "3px", padding: "0.7rem 1rem", color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div role="status" style={{ background: "rgba(76,139,64,0.12)", border: "1px solid rgba(76,139,64,0.35)", borderRadius: "3px", padding: "0.7rem 1rem", color: "#8bc98d", fontFamily: "var(--font-body)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          {state.success}
        </div>
      )}

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {character && <input type="hidden" name="id" value={character.id} />}

        {/* ── Identity ── */}
        <section>
          <p style={sectionHead}>Identity</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={fieldRow}>
              <label htmlFor="name" style={labelStyle}>Name *</label>
              <input id="name" name="name" type="text" defaultValue={character?.name ?? ""} required autoFocus={isNew} style={inputStyle} />
            </div>
            <div style={grid2}>
              <div style={fieldRow}>
                <label htmlFor="characterType" style={labelStyle}>Character Type</label>
                <select id="characterType" name="characterType" defaultValue={character?.characterType ?? "Human"} style={inputStyle}>
                  {CHARACTER_TYPES.map((t) => (
                    <option key={t} value={t} style={{ background: "var(--color-bg-elevated)" }}>{t}</option>
                  ))}
                </select>
              </div>
              <div style={fieldRow}>
                <label htmlFor="subtype" style={labelStyle}>Kind / Subtype</label>
                <input id="subtype" name="subtype" type="text" defaultValue={character?.subtype ?? ""} placeholder="e.g. Blood Witch, Gray Wolf…" style={inputStyle} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Appearance ── */}
        <section>
          <p style={sectionHead}>Appearance</p>
          <div style={grid3}>
            <div style={fieldRow}>
              <label htmlFor="hairColor" style={labelStyle}>Hair Color</label>
              <input id="hairColor" name="hairColor" type="text" defaultValue={character?.hairColor ?? ""} style={inputStyle} />
            </div>
            <div style={fieldRow}>
              <label htmlFor="eyeColor" style={labelStyle}>Eye Color</label>
              <input id="eyeColor" name="eyeColor" type="text" defaultValue={character?.eyeColor ?? ""} style={inputStyle} />
            </div>
            <div style={fieldRow}>
              <label htmlFor="bodyType" style={labelStyle}>Body Type</label>
              <input id="bodyType" name="bodyType" type="text" defaultValue={character?.bodyType ?? ""} placeholder="e.g. tall, wiry…" style={inputStyle} />
            </div>
          </div>
        </section>

        {/* ── Personality ── */}
        <section>
          <p style={sectionHead}>Personality</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={fieldRow}>
              <label htmlFor="attitude" style={labelStyle}>Attitude</label>
              <input id="attitude" name="attitude" type="text" defaultValue={character?.attitude ?? ""} placeholder="e.g. guarded, sardonic…" style={inputStyle} />
            </div>
            <div style={fieldRow}>
              <label htmlFor="quirks" style={labelStyle}>Quirks</label>
              <textarea id="quirks" name="quirks" defaultValue={character?.quirks ?? ""} rows={3} style={taStyle} placeholder="Unusual habits, tells, mannerisms…" />
            </div>
            <div style={fieldRow}>
              <label htmlFor="speakingStyle" style={labelStyle}>Speaking Style</label>
              <input id="speakingStyle" name="speakingStyle" type="text" defaultValue={character?.speakingStyle ?? ""} placeholder="e.g. terse, old-fashioned, verbose…" style={inputStyle} />
            </div>
          </div>
        </section>

        {/* ── Voice ── */}
        <section>
          <p style={sectionHead}>Voice</p>
          <div style={fieldRow}>
            <label htmlFor="phrases" style={labelStyle}>Frequently Said Phrases</label>
            <textarea id="phrases" name="phrases" defaultValue={character?.phrases ?? ""} rows={3} style={taStyle} placeholder="Catchphrases, repeated expressions…" />
          </div>
        </section>

        {/* ── Background ── */}
        <section>
          <p style={sectionHead}>Background</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={fieldRow}>
              <label htmlFor="origin" style={labelStyle}>Origin — Where They're From</label>
              <input id="origin" name="origin" type="text" defaultValue={character?.origin ?? ""} style={inputStyle} />
            </div>
            <div style={fieldRow}>
              <label htmlFor="livesIn" style={labelStyle}>Where They Live Now</label>
              <input id="livesIn" name="livesIn" type="text" defaultValue={character?.livesIn ?? ""} style={inputStyle} />
            </div>
            <div style={fieldRow}>
              <label htmlFor="homeDescription" style={labelStyle}>Home Description</label>
              <textarea id="homeDescription" name="homeDescription" defaultValue={character?.homeDescription ?? ""} rows={3} style={taStyle} placeholder="What their home/dwelling is like…" />
            </div>
          </div>
        </section>

        {/* ── Life ── */}
        <section>
          <p style={sectionHead}>Life Details</p>
          <div style={grid3}>
            <div style={fieldRow}>
              <label htmlFor="vehicles" style={labelStyle}>Vehicles</label>
              <input id="vehicles" name="vehicles" type="text" defaultValue={character?.vehicles ?? ""} style={inputStyle} />
            </div>
            <div style={fieldRow}>
              <label htmlFor="jobs" style={labelStyle}>Jobs / Occupation</label>
              <input id="jobs" name="jobs" type="text" defaultValue={character?.jobs ?? ""} style={inputStyle} />
            </div>
            <div style={fieldRow}>
              <label htmlFor="pets" style={labelStyle}>Pets</label>
              <input id="pets" name="pets" type="text" defaultValue={character?.pets ?? ""} style={inputStyle} />
            </div>
          </div>
        </section>

        {/* ── Notes ── */}
        <section>
          <p style={sectionHead}>General Notes</p>
          <div style={fieldRow}>
            <label htmlFor="notes" style={labelStyle}>Description / Notes</label>
            <textarea id="notes" name="notes" defaultValue={character?.notes ?? ""} rows={6} style={taStyle} placeholder="Any other details, history, description…" />
          </div>
        </section>

        {/* ── Save / Delete ── */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", paddingBottom: "0.5rem" }}>
          <button
            type="submit"
            disabled={savePending}
            style={{
              background: savePending ? "var(--color-border)" : "var(--color-crimson)",
              border: "none", borderRadius: "3px",
              padding: "0.7rem 1.5rem",
              color: "var(--color-ink)",
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              letterSpacing: "0.08em",
              cursor: savePending ? "default" : "pointer",
            }}
          >
            {savePending ? "Saving…" : isNew ? "Create Character" : "Save Changes"}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending}
              style={{
                background: "transparent",
                border: "1px solid var(--color-crimson-dim)",
                borderRadius: "3px",
                padding: "0.65rem 1.1rem",
                color: "#d4848e",
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                cursor: deletePending ? "default" : "pointer",
                marginLeft: "auto",
              }}
            >
              {deletePending ? "Deleting…" : "Delete Character"}
            </button>
          )}
        </div>
      </form>

      {/* ── Relationships (only for existing characters) ── */}
      {!isNew && (
        <section style={{ marginTop: "3rem" }}>
          <div
            style={{
              ...sectionHead,
              marginBottom: "1.25rem",
              fontSize: "1.25rem",
            }}
          >
            Relationships
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1rem" }}>
            Links to other characters — used to auto-draw the Connections Map.
          </p>

          {/* Existing relationships */}
          {relationships && relationships.length > 0 ? (
            <div>
              {relationships.map((rel) => (
                <RelRow
                  key={rel.id}
                  rel={rel}
                  thisId={character.id}
                  onRemove={handleRelRemove}
                />
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "0.5rem" }}>
              No relationships yet.
            </p>
          )}

          {/* Add relationship */}
          <AddRelForm
            thisId={character.id}
            allChars={allChars}
            onAdded={() => router.refresh()}
          />
        </section>
      )}
    </div>
  );
}
