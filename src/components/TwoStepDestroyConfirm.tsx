"use client";

import { useState, useEffect, useRef } from "react";

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(14,12,15,0.97)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
};

const panel: React.CSSProperties = {
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-crimson)",
  borderRadius: "6px",
  padding: "clamp(2rem, 5vw, 3rem)",
  maxWidth: "460px",
  width: "100%",
  textAlign: "center",
};

const btnDanger: React.CSSProperties = {
  background: "var(--color-crimson)",
  border: "none",
  borderRadius: "3px",
  padding: "0.75rem 1.75rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-heading)",
  fontSize: "1.05rem",
  letterSpacing: "0.08em",
  cursor: "pointer",
};

const btnCancel: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.75rem 1.75rem",
  color: "var(--color-ink-muted)",
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  cursor: "pointer",
};

export default function TwoStepDestroyConfirm({
  // Step 1: shown after "WARNING" heading
  firstWarningBody,
  itemName,
  onConfirm,
  onCancel,
}: {
  firstWarningBody: string;    // e.g. "You're about to destroy a universe!!"
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const pushedHistory = useRef(false);

  useEffect(() => {
    window.history.pushState({ castalia_popup: "two_step_destroy" }, "");
    pushedHistory.current = true;

    function handlePopState() {
      if (pushedHistory.current) {
        pushedHistory.current = false;
        onCancel();
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onCancel]);

  function cancel() {
    if (pushedHistory.current) {
      pushedHistory.current = false;
      window.history.back();
    } else {
      onCancel();
    }
  }

  function confirm() {
    if (pushedHistory.current) {
      pushedHistory.current = false;
      window.history.back();
    }
    onConfirm();
  }

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) cancel(); }}>
      <div style={panel}>
        {step === 1 ? (
          <>
            <div aria-hidden style={{ fontFamily: "var(--font-heading)", fontSize: "3rem", color: "var(--color-crimson)", marginBottom: "0.5rem", lineHeight: 1 }}>
              ✦
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.75rem", lineHeight: 1.15 }}>
              WARNING
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem", color: "#d4848e", marginBottom: "0.5rem", lineHeight: 1.65 }}>
              {firstWarningBody}
            </p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontStyle: "italic", color: "var(--color-ink-muted)", marginBottom: "2rem" }}>
              &ldquo;{itemName}&rdquo;
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" style={btnDanger} onClick={() => setStep(2)}>Delete</button>
              <button type="button" style={btnCancel} onClick={cancel}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div aria-hidden style={{ fontFamily: "var(--font-heading)", fontSize: "3rem", color: "var(--color-crimson)", marginBottom: "0.5rem", lineHeight: 1 }}>
              ✦ ✦ ✦
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 400, color: "var(--color-ink)", marginBottom: "1.75rem", lineHeight: 1.2 }}>
              ARE YOU SURE YOU WANT TO KILL THIS?
            </h2>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" style={btnDanger} onClick={confirm}>Yes</button>
              <button type="button" style={btnCancel} onClick={cancel}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
