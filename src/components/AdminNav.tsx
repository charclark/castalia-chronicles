"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import UniverseSelector from "./UniverseSelector";

type Universe = { id: string; name: string };

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", superAdminOnly: false },
  { href: "/admin/universes", label: "Universes", superAdminOnly: false },
  { href: "/admin/works", label: "Writing", superAdminOnly: false },
  { href: "/admin/feedback", label: "Feedback", superAdminOnly: false },
  { href: "/admin/mailing-list", label: "Mailing List", superAdminOnly: true },
  { href: "/admin/free-read-stats", label: "Read Stats", superAdminOnly: false },
  { href: "/admin/about", label: "The Lore Editor", superAdminOnly: false },
  { href: "/admin/author-profile", label: "My Author Profile", superAdminOnly: false },
  { href: "/admin/author-approvals", label: "Author Approvals", superAdminOnly: true },
  { href: "/admin/restore", label: "Restore", superAdminOnly: true },
  { href: "/admin/settings", label: "Settings", superAdminOnly: false },
  { href: "/admin/users", label: "Users", superAdminOnly: true },
];

export default function AdminNav({
  username,
  universes,
  currentUniverseId,
  isSuperAdmin,
}: {
  username: string;
  universes: Universe[];
  currentUniverseId: string | null;
  isSuperAdmin: boolean;
}) {
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
      {/* Top bar: brand + universe selector + user */}
      <div
        style={{
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
          height: "52px",
        }}
      >
        {/* Brand */}
        <Link
          href="/admin"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.35rem",
            fontWeight: 400,
            letterSpacing: "0.05em",
            color: "var(--color-ink)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          WriteWright
          <span
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              color: "var(--color-gold)",
              textTransform: "uppercase",
              marginLeft: "0.65rem",
              verticalAlign: "middle",
            }}
          >
            Admin
          </span>
        </Link>

        {/* Universe selector — always visible */}
        <UniverseSelector
          universes={universes}
          currentId={currentUniverseId}
        />

        {/* Right: view site + username + logout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            whiteSpace: "nowrap",
          }}
        >
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-ink-faint)",
              textDecoration: "none",
              letterSpacing: "0.04em",
              borderBottom: "1px solid var(--color-border)",
              paddingBottom: "1px",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-gold)";
              e.currentTarget.style.borderColor = "var(--color-gold-dim)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-ink-faint)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            View site ↗
          </Link>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              color: "var(--color-ink-faint)",
            }}
          >
            {username}
          </span>
          <form action={logout}>
            <button
              type="submit"
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "3px",
                padding: "0.28rem 0.75rem",
                color: "var(--color-ink-muted)",
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-ink)";
                e.currentTarget.style.borderColor = "var(--color-border-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-ink-muted)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              Log out
            </button>
          </form>
        </div>
      </div>

      {/* Nav links bar */}
      <nav
        style={{
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.15rem",
          height: "38px",
          borderTop: "1px solid var(--color-border)",
        }}
        aria-label="Admin navigation"
      >
        {NAV_LINKS.filter(({ superAdminOnly }) => !superAdminOnly || isSuperAdmin).map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                padding: "0.3rem 0.85rem",
                borderRadius: "3px",
                color: active ? "var(--color-gold)" : "var(--color-ink-muted)",
                textDecoration: "none",
                background: active ? "rgba(201,168,76,0.08)" : "transparent",
                transition: "color 0.15s, background 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
