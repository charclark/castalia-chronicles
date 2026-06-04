"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateImage, deleteImage } from "@/app/actions/images";

const CATEGORIES = [
  "book cover",
  "character art",
  "sketch",
  "map",
  "reference",
  "other",
] as const;

type ImageMeta = {
  id: string;
  label: string;
  category: string;
  createdAt: Date;
};

const fieldRow: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-ink-muted)",
};
const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
  borderRadius: "3px", padding: "0.6rem 0.8rem", color: "var(--color-ink)",
  fontFamily: "var(--font-body)", fontSize: "0.95rem", outline: "none", width: "100%",
};

export default function ImageDetail({ image }: { image: ImageMeta }) {
  const router = useRouter();
  const [state, action, savePending] = useActionState(updateImage, null);
  const [deletePending, startDelete] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete "${image.label}"? This cannot be undone.`)) return;
    startDelete(async () => {
      await deleteImage(image.id);
    });
  }

  return (
    <div style={{ maxWidth: "760px" }}>
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "var(--font-body)", fontSize: "0.88rem",
          color: "var(--color-ink-faint)", padding: 0, marginBottom: "1.5rem",
        }}
      >
        ← Back
      </button>

      <h2 style={{
        fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
        fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem",
      }}>
        {image.label}
      </h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2rem" }}>
        {image.category} · added {image.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      {/* Image */}
      <div style={{ marginBottom: "2rem", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/images/${image.id}`}
          alt={image.label}
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
        />
      </div>

      {/* Status */}
      {state?.error && (
        <div role="alert" style={{
          background: "rgba(139,38,53,0.15)", border: "1px solid var(--color-crimson-dim)",
          borderRadius: "3px", padding: "0.7rem 1rem", color: "#d4848e",
          fontFamily: "var(--font-body)", fontSize: "0.9rem", marginBottom: "1.25rem",
        }}>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div role="status" style={{
          background: "rgba(76,139,64,0.12)", border: "1px solid rgba(76,139,64,0.35)",
          borderRadius: "3px", padding: "0.7rem 1rem", color: "#8bc98d",
          fontFamily: "var(--font-body)", fontSize: "0.9rem", marginBottom: "1.25rem",
        }}>
          {state.success}
        </div>
      )}

      {/* Edit form */}
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <input type="hidden" name="id" value={image.id} />

        <div style={fieldRow}>
          <label htmlFor="label" style={labelStyle}>Label / Caption *</label>
          <input
            id="label"
            name="label"
            type="text"
            defaultValue={image.label}
            required
            style={inputStyle}
          />
        </div>

        <div style={fieldRow}>
          <label htmlFor="category" style={labelStyle}>Category</label>
          <select
            id="category"
            name="category"
            defaultValue={image.category}
            style={inputStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: "var(--color-bg-elevated)" }}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="submit"
            disabled={savePending}
            style={{
              background: savePending ? "var(--color-border)" : "var(--color-crimson)",
              border: "none", borderRadius: "3px",
              padding: "0.7rem 1.5rem", color: "var(--color-ink)",
              fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.08em",
              cursor: savePending ? "default" : "pointer",
            }}
          >
            {savePending ? "Saving…" : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deletePending}
            style={{
              background: "transparent",
              border: "1px solid var(--color-crimson-dim)",
              borderRadius: "3px", padding: "0.65rem 1.1rem",
              color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.88rem",
              cursor: deletePending ? "default" : "pointer",
              marginLeft: "auto",
            }}
          >
            {deletePending ? "Deleting…" : "Delete Image"}
          </button>
        </div>
      </form>
    </div>
  );
}
