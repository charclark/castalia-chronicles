"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin error]", error);
  }, [error]);

  return (
    <div
      style={{
        padding: "3rem 2rem",
        maxWidth: "640px",
        margin: "0 auto",
        fontFamily: "var(--font-body)",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.6rem",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "1rem",
        }}
      >
        Something went wrong
      </h2>

      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-crimson-dim)",
          borderRadius: "4px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.88rem",
            color: "#d4848e",
            margin: "0 0 0.4rem 0",
            fontWeight: 600,
          }}
        >
          {error.name}: {error.message}
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-ink-faint)",
              margin: 0,
            }}
          >
            Digest: {error.digest}
          </p>
        )}
      </div>

      <button
        onClick={reset}
        style={{
          background: "transparent",
          border: "1px solid var(--color-border)",
          borderRadius: "3px",
          padding: "0.5rem 1.25rem",
          color: "var(--color-ink-muted)",
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
