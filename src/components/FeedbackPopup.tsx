"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { submitFeedback } from "@/app/actions/public";

// ── Shared input style ────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function FeedbackPopup() {
  const [open, setOpenRaw] = useState(false);
  const pushedHistory = useRef(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // ── History API ─────────────────────────────────────────────────────────────

  function openPopup() {
    window.history.pushState({ castalia_popup: "feedback" }, "");
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
    setName("");
    setEmail("");
    setMessage("");
    setSuccess(false);
    setError("");
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await submitFeedback(name, email, message);
      if (result.success) setSuccess(true);
      else setError(result.error ?? "Something went wrong.");
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Nav trigger button ── */}
      <button
        type="button"
        onClick={openPopup}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.88rem",
          letterSpacing: "0.06em",
          padding: "0.28rem 0.85rem",
          borderRadius: "3px",
          border: "1px solid var(--color-crimson-dim)",
          background: "transparent",
          color: "#c47a83",
          cursor: "pointer",
          whiteSpace: "nowrap",
          marginLeft: "0.4rem",
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-crimson)";
          e.currentTarget.style.color = "#d4848e";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-crimson-dim)";
          e.currentTarget.style.color = "#c47a83";
        }}
      >
        Feedback
      </button>

      {/* ── Popup overlay ── */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Send feedback"
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
              maxWidth: "460px",
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
                  Thank you ✦
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--color-ink-muted)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
                  Your message has been received. I read every note personally.
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
                  Feedback
                </p>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 400, color: "var(--color-ink)", letterSpacing: "0.04em", marginBottom: "0.5rem", lineHeight: 1.2 }}>
                  Leave a Note
                </h2>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.7, marginBottom: "1.75rem" }}>
                  Thoughts, reactions, questions — I'd love to hear from you.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <div>
                    <label style={lbl}>Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      autoComplete="name"
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Email <span style={{ textTransform: "none", fontStyle: "italic", letterSpacing: 0, color: "var(--color-ink-faint)" }}>(optional)</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="What's on your mind?"
                      required
                      rows={5}
                      style={{ ...inp, resize: "vertical", lineHeight: 1.75 }}
                    />
                  </div>

                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", lineHeight: 1.6, margin: 0 }}>
                    By submitting feedback, you agree to our{" "}
                    <a href="/terms" target="_blank" rel="noopener" style={{ color: "var(--color-ink-faint)", textDecorationColor: "var(--color-border-light)" }}>Terms of Service</a>.
                    {" "}Please do not include personal information in your feedback.
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
                    {pending ? "Sending…" : "Send Feedback →"}
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
