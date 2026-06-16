"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FeedbackPopup from "./FeedbackPopup";
import MailingListWidget from "./MailingListWidget";

const NAV_LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/about", label: "The Lore", exact: false },
  { href: "/our-authors", label: "Our Authors", exact: false },
  { href: "/free-read", label: "Start Reading", exact: false },
  { href: "/books", label: "Discover Books", exact: false },
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
      <style>{`
        @media (max-width: 768px) {
          .pub-nav-brand { display: none !important; }

          .pub-nav-container {
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0.3rem 0.5rem !important;
            gap: 0 !important;
            min-height: unset !important;
          }

          .pub-nav-inner {
            flex-direction: column !important;
            align-items: center !important;
            gap: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          /* Row 1 */
          .pub-nav-row1 {
            display: flex !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
            padding: 0.25rem 0 !important;
          }
          .pub-nav-row1 a {
            font-size: 0.68rem !important;
            padding: 0.15rem 0.32rem !important;
          }

          /* Row 2 */
          .pub-nav-row2 {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 0.1rem !important;
            padding: 0.2rem 0 0.25rem !important;
          }
          .pub-nav-row2 .pub-cta-green {
            font-size: 0.74rem !important;
            padding: 0.18rem 0.55rem !important;
            margin-left: 0 !important;
          }
          .pub-nav-admin {
            font-size: 0.62rem !important;
            margin-left: 0.2rem !important;
          }
        }
      `}</style>

      <div
        className="pub-nav-container"
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
        {/* Brand — hidden on mobile */}
        <Link
          href="/"
          className="pub-nav-brand"
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

        {/* Nav — desktop: single flex row; mobile: two centered rows */}
        <nav
          className="pub-nav-inner"
          aria-label="Site navigation"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.1rem",
            padding: "0.5rem 0",
          }}
        >
          {/* Row 1 (display:contents on desktop → items flow inline with row2) */}
          <div className="pub-nav-row1" style={{ display: "contents" }}>
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
          </div>

          {/* Row 2 (display:contents on desktop) */}
          <div className="pub-nav-row2" style={{ display: "contents" }}>
            <Link
              href="/write-with-us"
              className="pub-cta-green"
              style={{ fontSize: "0.88rem", padding: "0.28rem 0.85rem", marginLeft: "0.25rem", whiteSpace: "nowrap" }}
            >
              Write With Us
            </Link>

            <MailingListWidget />
            <FeedbackPopup />

            <Link
              href="/admin"
              className="pub-nav-admin"
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
          </div>
        </nav>
      </div>
    </header>
  );
}
