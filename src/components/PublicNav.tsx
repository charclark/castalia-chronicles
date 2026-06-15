"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FeedbackPopup from "./FeedbackPopup";
import MailingListWidget from "./MailingListWidget";

const NAV_LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/about", label: "The Lore", exact: false },
  { href: "/our-authors", label: "Our Authors", exact: false },
  { href: "/free-read", label: "Free Read", exact: false },
  { href: "/books", label: "Published Books", exact: false },
] as const;

export default function PublicNav() {
  const pathname = usePathname();

  return (
    <header
      style={{
        background: "var(--color-bg-surface)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.25rem 1.5rem",
          minHeight: "58px",
        }}
      >
        {/* Brand — always visible */}
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.05rem, 2.5vw, 1.3rem)",
            fontWeight: 400,
            letterSpacing: "0.06em",
            color: "var(--color-ink)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            padding: "0.6rem 0",
            flexShrink: 0,
          }}
        >
          WriteWright
        </Link>

        {/* Nav links — wrap gracefully on small screens, never collapse to hamburger */}
        <nav
          aria-label="Site navigation"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.1rem",
            padding: "0.5rem 0",
          }}
        >
          {NAV_LINKS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.92rem",
                  letterSpacing: "0.03em",
                  padding: "0.3rem 0.72rem",
                  borderRadius: "3px",
                  color: active ? "var(--color-gold)" : "var(--color-ink-muted)",
                  background: active ? "rgba(201,168,76,0.07)" : "transparent",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "var(--color-ink)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "var(--color-ink-muted)";
                }}
              >
                {label}
              </Link>
            );
          })}

          <MailingListWidget />
          <FeedbackPopup />

          {/* Subtle admin entry point — small, unobtrusive, far right */}
          <Link
            href="/admin"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.72rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-ink-faint)",
              textDecoration: "none",
              padding: "0.3rem 0.4rem",
              marginLeft: "0.5rem",
              opacity: 0.5,
              transition: "opacity 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.color = "var(--color-ink-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.5";
              e.currentTarget.style.color = "var(--color-ink-faint)";
            }}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
