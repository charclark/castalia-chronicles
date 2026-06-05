"use client";

import { useState, useEffect } from "react";

interface Props {
  title: string;
  snippet: string;
}

export default function SnippetViewer({ title, snippet }: Props) {
  const [open, setOpen] = useState(false);

  // Register in browser history when open so the Back button closes this popup
  useEffect(() => {
    if (!open) return;

    history.pushState({ snippetOpen: true }, "");
    document.body.style.overflow = "hidden";

    function handlePopState() {
      setOpen(false);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleClose() {
    // Navigate back — the popstate listener above calls setOpen(false)
    history.back();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pub-cta-secondary"
        style={{ fontSize: "0.88rem", padding: "0.55rem 1.1rem" }}
      >
        Read a sample
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Sample: ${title}`}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(14,12,15,0.96)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            style={{
              maxWidth: "700px",
              width: "100%",
              margin: "0 auto",
              padding: "clamp(2rem, 6vw, 4rem) clamp(1.25rem, 4vw, 2.5rem)",
            }}
          >
            {/* Back button */}
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                color: "var(--color-ink-faint)",
                padding: 0,
                marginBottom: "2rem",
                display: "inline-block",
              }}
            >
              ← Back
            </button>

            {/* Header */}
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.72rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--color-gold)",
                marginBottom: "0.5rem",
              }}
            >
              Sample
            </p>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                fontWeight: 400,
                color: "var(--color-ink)",
                letterSpacing: "0.04em",
                lineHeight: 1.15,
                marginBottom: "1.25rem",
              }}
            >
              {title}
            </h2>
            <div
              aria-hidden
              style={{
                width: "48px",
                height: "1px",
                background: "var(--color-gold-dim)",
                marginBottom: "2rem",
              }}
            />

            {/* Snippet content */}
            <div className="tiptap-writing-area">
              <div
                className="tiptap"
                dangerouslySetInnerHTML={{ __html: snippet }}
              />
            </div>

            {/* Footer ornament */}
            <div
              aria-hidden
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                marginTop: "3rem",
                marginBottom: "2rem",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: "60px",
                  height: "1px",
                  background:
                    "linear-gradient(to right, transparent, var(--color-border-light))",
                }}
              />
              <span
                style={{ color: "var(--color-gold)", fontSize: "0.65rem", opacity: 0.8 }}
              >
                ✦
              </span>
              <span
                style={{
                  display: "block",
                  width: "60px",
                  height: "1px",
                  background:
                    "linear-gradient(to left, transparent, var(--color-border-light))",
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                color: "var(--color-ink-faint)",
                padding: 0,
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </>
  );
}
