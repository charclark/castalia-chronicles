"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchUniverse } from "@/app/actions/universe";

type Universe = { id: string; name: string };

export default function UniverseSelector({
  universes,
  currentId,
}: {
  universes: Universe[];
  currentId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id || id === currentId) return;
    startTransition(async () => {
      await switchUniverse(id);
      router.refresh();
    });
  }

  if (universes.length === 0) {
    return (
      <a
        href="/admin/universes"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
          color: "var(--color-gold)",
          letterSpacing: "0.06em",
          fontStyle: "italic",
          whiteSpace: "nowrap",
          textDecoration: "none",
        }}
      >
        + Create a universe
      </a>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.45rem",
        opacity: pending ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-ink-faint)",
          whiteSpace: "nowrap",
        }}
      >
        Universe
      </span>
      <select
        value={currentId ?? ""}
        onChange={handleChange}
        disabled={pending}
        aria-label="Select active universe"
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border-light)",
          borderRadius: "3px",
          padding: "0.3rem 0.5rem",
          color: "var(--color-gold)",
          fontFamily: "var(--font-heading)",
          fontSize: "1rem",
          letterSpacing: "0.04em",
          cursor: "pointer",
          outline: "none",
          minWidth: "120px",
        }}
      >
        {universes.map((u) => (
          <option key={u.id} value={u.id} style={{ background: "var(--color-bg-elevated)", color: "var(--color-ink)" }}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );
}
