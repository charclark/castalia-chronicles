"use client";

import { useActionState, useState, useTransition } from "react";
import { login, requestTempPassword } from "@/app/actions/auth";

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.7rem 0.9rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.85rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-ink-muted)",
};

// ── Ornament divider ──────────────────────────────────────────────────────────

function Ornament() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
      <span style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
      <span style={{ color: "var(--color-gold)", fontSize: "0.6rem" }}>✦</span>
      <span style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
    </div>
  );
}

// ── Forgot-password panel ─────────────────────────────────────────────────────

function ForgotPasswordPanel({ onBack }: { onBack: () => void }) {
  const [username, setUsername] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTempPassword("");
    startTransition(async () => {
      const result = await requestTempPassword(username);
      if (result.error) setError(result.error);
      else if (result.tempPassword) setTempPassword(result.tempPassword);
    });
  }

  return (
    <>
      <Ornament />

      {tempPassword ? (
        /* ── Temp password revealed ── */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem" }}>
              Temporary Password
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
              Use this to sign in, then change your password in Admin → Settings.
            </p>
            <div
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-gold-dim)",
                borderRadius: "3px",
                padding: "0.9rem 1rem",
                fontFamily: "monospace",
                fontSize: "1.3rem",
                letterSpacing: "0.12em",
                color: "var(--color-gold)",
                textAlign: "center",
                userSelect: "all",
              }}
            >
              {tempPassword}
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginTop: "0.5rem", textAlign: "center" }}>
              Click the password to select it, then copy.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            style={{
              background: "var(--color-crimson)",
              border: "none",
              borderRadius: "3px",
              padding: "0.8rem 1.5rem",
              color: "var(--color-ink)",
              fontFamily: "var(--font-heading)",
              fontSize: "1.1rem",
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        /* ── Username form ── */
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.35rem" }}>
              Reset Password
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.65 }}>
              Enter your username and a temporary password will be shown on screen.
            </p>
          </div>

          {error && (
            <div role="alert" style={{ background: "rgba(139,38,53,0.15)", border: "1px solid var(--color-crimson-dim)", borderRadius: "3px", padding: "0.75rem 1rem", color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-gold)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            style={{
              background: pending ? "var(--color-border)" : "var(--color-crimson)",
              border: "none",
              borderRadius: "3px",
              padding: "0.8rem 1.5rem",
              color: "var(--color-ink)",
              fontFamily: "var(--font-heading)",
              fontSize: "1.1rem",
              letterSpacing: "0.1em",
              cursor: pending ? "default" : "pointer",
            }}
          >
            {pending ? "Checking…" : "Get Temporary Password"}
          </button>

          <button
            type="button"
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.88rem",
              color: "var(--color-ink-faint)",
              padding: 0,
              textAlign: "center",
            }}
          >
            ← Back to sign in
          </button>
        </form>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  const [showForgot, setShowForgot] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        background: "radial-gradient(ellipse at 50% 0%, rgba(139,38,53,0.14) 0%, transparent 55%), var(--color-bg)",
      }}
    >
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
        WriteWright
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
        {showForgot ? (
          <ForgotPasswordPanel onBack={() => setShowForgot(false)} />
        ) : (
          <>
            <Ornament />

            <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {state?.error && (
                <div role="alert" style={{ background: "rgba(139,38,53,0.15)", border: "1px solid var(--color-crimson-dim)", borderRadius: "3px", padding: "0.75rem 1rem", color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
                  {state.error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label htmlFor="username" style={labelStyle}>Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>

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
                onMouseEnter={(e) => { if (!pending) e.currentTarget.style.background = "var(--color-crimson-dim)"; }}
                onMouseLeave={(e) => { if (!pending) e.currentTarget.style.background = "var(--color-crimson)"; }}
              >
                {pending ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Forgot password */}
            <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  color: "var(--color-ink-faint)",
                  padding: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-ink-muted)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-ink-faint)")}
              >
                Forgot password?
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
