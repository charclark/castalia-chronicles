"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { submitJoinRequest } from "@/app/actions/join-requests";

const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Horror",
  "Romance",
  "Thriller",
  "Mystery",
  "Literary Fiction",
  "Historical Fiction",
  "Other",
];

const inp: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.65rem 0.9rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
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

const fieldWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
};

const hint: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.72rem",
  color: "var(--color-ink-faint)",
  fontStyle: "italic",
};

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function WriteWithUsForm() {
  const [state, action, pending] = useActionState(submitJoinRequest, null);

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced username check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const val = username.trim();
    if (!val || val.length < 2) { setUsernameStatus("idle"); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(val)) { setUsernameStatus("invalid"); return; }

    setUsernameStatus("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-username?username=${encodeURIComponent(val)}`);
        const data = await res.json();
        setUsernameStatus(data.available === true ? "available" : data.available === false ? "taken" : "idle");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [username]);

  function toggleGenre(g: string) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  if (state?.success) {
    return (
      <div style={{ padding: "3rem 0", textAlign: "center" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem", color: "var(--color-gold)", display: "block", marginBottom: "1rem" }}>✦</span>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.75rem" }}>
          Application Received
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--color-ink-muted)", lineHeight: 1.75 }}>
          Your application has been submitted. We&apos;ll be in touch soon.
        </p>
      </div>
    );
  }

  const usernameIndicator = () => {
    if (usernameStatus === "checking") return <span style={{ ...hint, color: "var(--color-ink-faint)" }}>Checking…</span>;
    if (usernameStatus === "available") return <span style={{ ...hint, color: "#8bc98d" }}>✓ Username available</span>;
    if (usernameStatus === "taken")    return <span style={{ ...hint, color: "#d4848e" }}>✗ Username already taken</span>;
    if (usernameStatus === "invalid")  return <span style={{ ...hint, color: "#d4848e" }}>Letters, numbers, hyphens, and underscores only</span>;
    return null;
  };

  const CHECKBOXES = [
    { name: "confirmedAge",           label: "I confirm that I am 18 years of age or older" },
    { name: "confirmedOriginalAuthor", label: "I confirm that I am the original author of all work I plan to submit to WriteWright" },
    { name: "confirmedPlagiarism",    label: "I understand that submitting plagiarized content may result in immediate account termination and potential legal action" },
    { name: "confirmedApproval",      label: "I understand that all content I submit requires approval by the WriteWright creator before it appears publicly" },
    { name: "confirmedPersonalUse",   label: "I confirm that this account is for my personal use only" },
    { name: "confirmedRightToRefuse", label: "I understand that WriteWright reserves the right to decline my application without providing a reason" },
  ];

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Hidden field for genres */}
      <input type="hidden" name="genres" value={selectedGenres.join(", ")} />

      {/* Full Name */}
      <div style={fieldWrap}>
        <label htmlFor="fullName" style={lbl}>Full Name <Req /></label>
        <input id="fullName" name="fullName" type="text" required autoComplete="name" style={inp} />
      </div>

      {/* Email */}
      <div style={fieldWrap}>
        <label htmlFor="email" style={lbl}>Email Address <Req /></label>
        <input id="email" name="email" type="email" required autoComplete="email" style={inp} />
      </div>

      {/* Username */}
      <div style={fieldWrap}>
        <label htmlFor="requestedUsername" style={lbl}>Requested Username <Req /></label>
        <input
          id="requestedUsername"
          name="requestedUsername"
          type="text"
          required
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            ...inp,
            borderColor: usernameStatus === "taken" || usernameStatus === "invalid"
              ? "rgba(212,132,142,0.5)"
              : usernameStatus === "available"
              ? "rgba(139,201,141,0.5)"
              : "var(--color-border)",
          }}
        />
        {usernameIndicator()}
      </div>

      {/* Genres */}
      <div style={fieldWrap}>
        <p style={lbl}>Genre(s) <Req /></p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 0.75rem" }}>
          {GENRES.map((g) => {
            const checked = selectedGenres.includes(g);
            return (
              <label
                key={g}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  fontFamily: "var(--font-body)", fontSize: "0.88rem",
                  color: checked ? "var(--color-ink)" : "var(--color-ink-muted)",
                  cursor: "pointer", userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleGenre(g)}
                  style={{ accentColor: "var(--color-gold)", width: "14px", height: "14px", flexShrink: 0 }}
                />
                {g}
              </label>
            );
          })}
        </div>
        {selectedGenres.length === 0 && (
          <p style={{ ...hint, color: "var(--color-ink-faint)" }}>Select at least one genre.</p>
        )}
      </div>

      {/* About You */}
      <div style={fieldWrap}>
        <label htmlFor="aboutYou" style={lbl}>About You and Your Writing <Req /></label>
        <textarea
          id="aboutYou"
          name="aboutYou"
          required
          rows={7}
          placeholder="Tell us about yourself and your writing. What worlds are you building? What draws you to the page?"
          style={{ ...inp, lineHeight: 1.75, resize: "vertical" }}
        />
      </div>

      {/* Existing Work Link — optional */}
      <div style={fieldWrap}>
        <label htmlFor="existingWorkLink" style={lbl}>Existing Work Link <span style={{ textTransform: "none", fontStyle: "italic", letterSpacing: 0, color: "var(--color-ink-faint)", fontSize: "0.75rem" }}>(optional)</span></label>
        <p style={{ ...hint, marginBottom: "0.3rem" }}>
          New to publishing? Welcome — you belong here. If you have existing work published elsewhere that you&apos;d like to share with us, drop a link below. Totally optional.
        </p>
        <input id="existingWorkLink" name="existingWorkLink" type="url" placeholder="https://" style={inp} />
      </div>

      {/* How Did You Hear — optional */}
      <div style={fieldWrap}>
        <label htmlFor="howDidYouHear" style={lbl}>How did you hear about us? <span style={{ textTransform: "none", fontStyle: "italic", letterSpacing: 0, color: "var(--color-ink-faint)", fontSize: "0.75rem" }}>(optional)</span></label>
        <input id="howDidYouHear" name="howDidYouHear" type="text" style={inp} />
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--color-border)" }} />

      {/* Checkboxes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <p style={{ ...lbl, marginBottom: "0.1rem" }}>Confirmations <Req /></p>
        {CHECKBOXES.map(({ name, label }) => (
          <CheckboxRow key={name} name={name} label={label} />
        ))}
        {/* Terms checkbox with links */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            name="confirmedTerms"
            required
            style={{ accentColor: "var(--color-gold)", width: "14px", height: "14px", flexShrink: 0, marginTop: "2px" }}
          />
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.55 }}>
            I have read and agree to the{" "}
            <Link href="/terms" target="_blank" rel="noopener" style={{ color: "var(--color-ink-muted)", textDecorationColor: "var(--color-border-light)" }}>Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" target="_blank" rel="noopener" style={{ color: "var(--color-ink-muted)", textDecorationColor: "var(--color-border-light)" }}>Privacy Policy</Link>
          </span>
        </label>
      </div>

      {/* Error */}
      {state?.error && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#d4848e" }}>{state.error}</p>
      )}

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={pending}
          style={{
            background: pending ? "var(--color-border)" : "var(--color-crimson)",
            border: "none", borderRadius: "3px",
            padding: "0.75rem 1.75rem",
            color: "var(--color-ink)", fontFamily: "var(--font-heading)",
            fontSize: "1rem", letterSpacing: "0.06em",
            cursor: pending ? "default" : "pointer",
          }}
        >
          {pending ? "Sending…" : "Send My Application"}
        </button>
      </div>
    </form>
  );
}

function Req() {
  return <span style={{ color: "var(--color-crimson)", marginLeft: "2px" }} aria-hidden>*</span>;
}

function CheckboxRow({ name, label }: { name: string; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
      <input
        type="checkbox"
        name={name}
        required
        style={{ accentColor: "var(--color-gold)", width: "14px", height: "14px", flexShrink: 0, marginTop: "2px" }}
      />
      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.55 }}>
        {label}
      </span>
    </label>
  );
}
