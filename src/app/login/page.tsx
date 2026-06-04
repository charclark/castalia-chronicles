"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(139,38,53,0.14) 0%, transparent 55%), var(--color-bg)",
      }}
    >
      {/* Heading */}
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
          fontWeight: 400,
          letterSpacing: "0.06em",
          color: "var(--color-ink)",
          marginBottom: "0.25rem",
          textAlign: "center",
        }}
      >
        The Castalia Chronicles
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          fontStyle: "italic",
          color: "var(--color-ink-faint)",
          letterSpacing: "0.08em",
          marginBottom: "3rem",
          textAlign: "center",
        }}
      >
        Admin Access
      </p>

      {/* Login card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          padding: "2.5rem 2rem",
        }}
      >
        {/* Ornament */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "2rem",
          }}
        >
          <span
            style={{
              flex: 1,
              height: "1px",
              background: "var(--color-border)",
            }}
          />
          <span
            style={{ color: "var(--color-gold)", fontSize: "0.6rem" }}
          >
            ✦
          </span>
          <span
            style={{
              flex: 1,
              height: "1px",
              background: "var(--color-border)",
            }}
          />
        </div>

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Error message */}
          {state?.error && (
            <div
              role="alert"
              style={{
                background: "rgba(139,38,53,0.15)",
                border: "1px solid var(--color-crimson-dim)",
                borderRadius: "3px",
                padding: "0.75rem 1rem",
                color: "#d4848e",
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
              }}
            >
              {state.error}
            </div>
          )}

          {/* Username */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label
              htmlFor="username"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-ink-muted)",
              }}
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "3px",
                padding: "0.7rem 0.9rem",
                color: "var(--color-ink)",
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-gold)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label
              htmlFor="password"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-ink-muted)",
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "3px",
                padding: "0.7rem 0.9rem",
                color: "var(--color-ink)",
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-gold)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            style={{
              marginTop: "0.5rem",
              background: pending ? "var(--color-border)" : "var(--color-crimson)",
              border: "none",
              borderRadius: "3px",
              padding: "0.8rem 1.5rem",
              color: "var(--color-ink)",
              fontFamily: "var(--font-heading)",
              fontSize: "1.1rem",
              letterSpacing: "0.1em",
              cursor: pending ? "default" : "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!pending) (e.currentTarget.style.background = "var(--color-crimson-dim)");
            }}
            onMouseLeave={(e) => {
              if (!pending) (e.currentTarget.style.background = "var(--color-crimson)");
            }}
          >
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
