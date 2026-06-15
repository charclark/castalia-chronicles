"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { subscribeMailing } from "@/app/actions/public";

const inp: React.CSSProperties = {
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.65rem 0.9rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  outline: "none",
  width: "100%",
  lineHeight: 1.5,
};

const lbl: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.75rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-ink-muted)",
  marginBottom: "0.3rem",
  display: "block",
};

export default function MailingListWidget() {
  const [open, setOpenRaw] = useState(false);
  const pushedHistory = useRef(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // ── History API ─────────────────────────────────────────────────────────────

  function openPopup() {
    window.history.pushState({ castalia_popup: "subscribe" }, "");
    pushedHistory.current = true;
    setOpenRaw(true);
  }

  function closePopup() {
    setOpenRaw(false);
    resetForm();
    if (pushedHistory.current) {
      pushedHistory.current = false;
      window.history.back();
    }
  }

  useEffect(() => {
    function onPopState() {
      if (pushedHistory.current) {
        pushedHistory.current = false;
        setOpenRaw(false);
        resetForm();
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEmail("");
    setName("");
    setSuccess(false);
    setAlreadySubscribed(false);
    setError("");
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await subscribeMailing(email, name);
      if (result.success) {
        setSuccess(true);
        setAlreadySubscribed(!!result.alreadySubscribed);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={openPopup}
        className="pub-cta-primary"
      >
        Get Updates!
      </button>

      {/* ── Popup overlay ── */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Get updates — join the mailing list"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(14,12,15,0.94)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closePopup(); }}
        >
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-light)",
              borderRadius: "6px",
              padding: "clamp(1.75rem, 5vw, 2.5rem)",
              maxWidth: "440px",
              width: "100%",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Close × */}
            <button
              type="button"
              onClick={closePopup}
              aria-label="Close"
              style={{
                position: "absolute",
                top: "0.9rem",
                right: "1rem",
                background: "transparent",
                border: "none",
                color: "var(--color-ink-faint)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "1.4rem",
                lineHeight: 1,
                padding: "0.2rem 0.3rem",
              }}
            >
              ×
            </button>

            {success ? (
              /* ── Success state ── */
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.75rem" }}>
                  {alreadySubscribed ? "You're already on the list ✦" : "You're subscribed ✦"}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--color-ink-muted)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
                  {alreadySubscribed
                    ? "That email address is already on the list. I'll be in touch when new stories arrive."
                    : "Thank you! I'll reach out when new stories and announcements arrive."}
                </p>
                <button
                  type="button"
                  onClick={closePopup}
                  className="pub-cta-secondary"
                  style={{ fontSize: "0.9rem" }}
                >
                  Close
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem" }}>
                  Stay in the loop
                </p>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 400, color: "var(--color-ink)", letterSpacing: "0.04em", marginBottom: "0.5rem", lineHeight: 1.2 }}>
                  Get Notified
                </h2>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.7, marginBottom: "1.75rem" }}>
                  Be the first to hear when new stories are posted, books are released, or news worth sharing arrives.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <div>
                    <label style={lbl}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>
                      Name{" "}
                      <span style={{ textTransform: "none", fontStyle: "italic", letterSpacing: 0, color: "var(--color-ink-faint)" }}>
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      style={inp}
                    />
                  </div>

                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", lineHeight: 1.6, margin: 0 }}>
                    By signing up, you agree to our{" "}
                    <a href="/privacy" target="_blank" rel="noopener" style={{ color: "var(--color-ink-faint)", textDecorationColor: "var(--color-border-light)" }}>Privacy Policy</a>.
                    {" "}We&apos;ll never share your email or send you anything other than WriteWright updates.
                  </p>

                  {error && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#d4848e" }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={pending}
                    style={{
                      background: pending ? "var(--color-border)" : "var(--color-gold)",
                      border: "none",
                      borderRadius: "3px",
                      padding: "0.7rem 1.75rem",
                      color: pending ? "var(--color-ink-muted)" : "var(--color-bg)",
                      fontFamily: "var(--font-heading)",
                      fontSize: "1rem",
                      letterSpacing: "0.06em",
                      cursor: pending ? "default" : "pointer",
                      alignSelf: "flex-start",
                    }}
                  >
                    {pending ? "Signing up…" : "Get Updates! →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
