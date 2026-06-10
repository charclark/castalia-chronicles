"use client";

import { useActionState, useTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateLocation, createLocation, deleteLocation } from "@/app/actions/locations";

type LocationData = {
  id: string;
  name: string;
  locatedIn: string | null;
  climate: string | null;
  atmosphere: string | null;
  description: string | null;
  notes: string | null;
};

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

// ── Main form ────────────────────────────────────────────────────────────────

export default function LocationForm({ location, canEdit = true }: { location?: LocationData; canEdit?: boolean }) {
  const router = useRouter();
  const isNew = !location;

  const saveAction = isNew ? createLocation : updateLocation;
  const [formKey, setFormKey] = useState(0);
  const [state, action, savePending] = useActionState(saveAction, null);
  const [deletePending, startDelete] = useTransition();

  useEffect(() => {
    if (isNew && state?.success) {
      setFormKey((k) => k + 1);
      router.refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleDelete() {
    if (!window.confirm(`Delete "${location!.name}"? This cannot be undone.`)) return;
    startDelete(async () => {
      await deleteLocation(location!.id);
    });
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
        {isNew ? "New Location" : location.name}
      </h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2rem" }}>
        {isNew ? "Add a new location to this universe." : (location.locatedIn ?? "")}
      </p>

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

      <form key={formKey} action={action} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {location && <input type="hidden" name="id" value={location.id} />}
        <fieldset disabled={!canEdit} style={{ border: "none", margin: 0, padding: 0, minWidth: 0 }}>

        {/* ── Identity ── */}
        <section>
          <p style={sectionHead}>Identity</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={fieldRow}>
              <label htmlFor="name" style={labelStyle}>Name *</label>
              <input id="name" name="name" type="text" defaultValue={location?.name ?? ""} required autoFocus={isNew} style={inputStyle} />
            </div>
            <div style={fieldRow}>
              <label htmlFor="locatedIn" style={labelStyle}>Where It Is Located</label>
              <input id="locatedIn" name="locatedIn" type="text" defaultValue={location?.locatedIn ?? ""} placeholder="e.g. Northern highlands, underground, coastal cliffs…" style={inputStyle} />
            </div>
          </div>
        </section>

        {/* ── Setting ── */}
        <section>
          <p style={sectionHead}>Setting</p>
          <div style={grid2}>
            <div style={fieldRow}>
              <label htmlFor="climate" style={labelStyle}>Weather / Climate</label>
              <input id="climate" name="climate" type="text" defaultValue={location?.climate ?? ""} placeholder="e.g. perpetually overcast, dry and scorching…" style={inputStyle} />
            </div>
            <div style={fieldRow}>
              <label htmlFor="atmosphere" style={labelStyle}>Feel / Atmosphere</label>
              <input id="atmosphere" name="atmosphere" type="text" defaultValue={location?.atmosphere ?? ""} placeholder="e.g. eerie silence, bustling market energy…" style={inputStyle} />
            </div>
          </div>
        </section>

        {/* ── Description ── */}
        <section>
          <p style={sectionHead}>Description</p>
          <div style={fieldRow}>
            <label htmlFor="description" style={labelStyle}>What the Place Is Like</label>
            <textarea id="description" name="description" defaultValue={location?.description ?? ""} rows={6} style={taStyle} placeholder="Describe the physical space, layout, notable features, sensory details…" />
          </div>
        </section>

        {/* ── Notes ── */}
        <section>
          <p style={sectionHead}>General Notes</p>
          <div style={fieldRow}>
            <label htmlFor="notes" style={labelStyle}>Notes</label>
            <textarea id="notes" name="notes" defaultValue={location?.notes ?? ""} rows={4} style={taStyle} placeholder="Plot relevance, history, lore, anything else…" />
          </div>
        </section>

        </fieldset>

        {/* ── Save / Delete ── */}
        {canEdit && (
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
              {savePending ? "Saving…" : isNew ? "Create Location" : "Save Changes"}
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
                {deletePending ? "Deleting…" : "Delete Location"}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
