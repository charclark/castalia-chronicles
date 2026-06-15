"use client";

import Link from "next/link";
import MailingListWidget from "./MailingListWidget";

export default function PublicFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-bg-surface)",
        padding: "clamp(2.5rem, 6vw, 4rem) 1.5rem",
        marginTop: "auto",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Mailing list CTA */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.3rem, 3vw, 1.7rem)",
                fontWeight: 400,
                color: "var(--color-ink)",
                letterSpacing: "0.04em",
                marginBottom: "0.35rem",
              }}
            >
              Stay in the loop
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.92rem",
                color: "var(--color-ink-muted)",
                fontStyle: "italic",
              }}
            >
              New stories, releases, and occasional dispatches from the dark.
            </p>
          </div>
          <MailingListWidget />
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "1.75rem" }} />

        {/* Bottom row: nav + copyright */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem 2rem",
          }}
        >
          <nav
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.1rem",
            }}
          >
            {[
              { href: "/", label: "Home" },
              { href: "/about", label: "The Lore" },
              { href: "/our-authors", label: "Our Authors" },
              { href: "/free-read", label: "Start Reading" },
              { href: "/books", label: "Discover Books" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  color: "var(--color-ink-faint)",
                  padding: "0.25rem 0.65rem",
                  textDecoration: "none",
                  borderRadius: "3px",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-ink-muted)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-ink-faint)")}
              >
                {label}
              </Link>
            ))}
          </nav>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-ink-faint)",
              fontStyle: "italic",
            }}
          >
            WriteWright
          </p>
        </div>

        {/* Legal links */}
        <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.1rem", flexWrap: "wrap" }}>
          {[
            { href: "/terms", label: "Terms of Service" },
            { href: "/privacy", label: "Privacy Policy" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.78rem",
                color: "var(--color-ink-faint)",
                padding: "0.2rem 0.65rem",
                textDecoration: "none",
                borderRadius: "3px",
                transition: "color 0.15s",
                opacity: 0.7,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-ink-muted)"; e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-ink-faint)"; e.currentTarget.style.opacity = "0.7"; }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
