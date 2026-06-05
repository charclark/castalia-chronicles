"use client";

import { useState, useTransition } from "react";
import { permanentDeleteArchivedUniverse, restoreUniverse } from "@/app/actions/universe";
import DestroyUniverseConfirm from "@/components/DestroyUniverseConfirm";

type ArchivedUniverse = {
  id: string;
  name: string;
  description: string | null;
  archivedAt: Date | null;
  createdBy: { username: string } | null;
  archivedBy: { username: string } | null;
};

const card: React.CSSProperties = {
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  padding: "1.25rem 1.5rem",
};

const btnSm: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.3rem 0.75rem",
  color: "var(--color-ink-muted)",
  fontFamily: "var(--font-body)",
  fontSize: "0.82rem",
  cursor: "pointer",
};

function ArchivedRow({ universe }: { universe: ArchivedUniverse }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function handlePermanentDelete() {
    setShowConfirm(false);
    start(async () => {
      const r = await permanentDeleteArchivedUniverse(universe.id);
      if (r.error) setError(r.error);
    });
  }

  function handleRestore() {
    if (!window.confirm(`Restore "${universe.name}" to ${universe.createdBy?.username ?? "its creator"}?`)) return;
    start(async () => {
      const r = await restoreUniverse(universe.id);
      if (r.error) setError(r.error);
    });
  }

  return (
    <>
      <div
        style={{
          ...card,
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem 1rem",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: pending ? 0.5 : 1,
          transition: "opacity 0.2s",
        }}
      >
        <div style={{ flex: 1, minWidth: "160px" }}>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.2rem",
              fontWeight: 400,
              color: "var(--color-ink-muted)",
              marginBottom: "0.2rem",
            }}
          >
            {universe.name}
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-ink-faint)",
            }}
          >
            By {universe.createdBy?.username ?? "unknown"}
            {" · "}Archived by {universe.archivedBy?.username ?? "unknown"}
            {universe.archivedAt && (
              <>
                {" on "}
                {universe.archivedAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </>
            )}
          </p>
          {error && (
            <p style={{ color: "#d4848e", fontSize: "0.8rem", marginTop: "0.3rem" }}>{error}</p>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleRestore}
            disabled={pending}
            style={{ ...btnSm, color: "var(--color-gold)", borderColor: "var(--color-gold-dim)" }}
          >
            Restore
          </button>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={pending}
            style={{ ...btnSm, color: "#d4848e", borderColor: "var(--color-crimson-dim)" }}
          >
            Delete Permanently
          </button>
        </div>
      </div>

      {showConfirm && (
        <DestroyUniverseConfirm
          universeName={universe.name}
          onConfirm={handlePermanentDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

export default function ArchivedUniverses({
  universes,
}: {
  universes: ArchivedUniverse[];
}) {
  return (
    <div style={{ marginTop: "3.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.5rem",
            fontWeight: 400,
            color: "var(--color-ink-muted)",
            letterSpacing: "0.04em",
          }}
        >
          Archived Universes
        </h3>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-ink-faint)",
            border: "1px solid var(--color-border)",
            borderRadius: "2px",
            padding: "0.15rem 0.5rem",
          }}
        >
          {universes.length}
        </span>
      </div>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.88rem",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginBottom: "1.25rem",
        }}
      >
        Universes archived by other users. Restore them or delete them permanently.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {universes.map((u) => (
          <ArchivedRow key={u.id} universe={u} />
        ))}
      </div>
    </div>
  );
}
