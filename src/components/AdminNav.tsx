"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <header
      style={{
        background: "var(--color-bg-surface)",
        borderBottom: "1px solid var(--color-border)",
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
        height: "56px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand */}
      <Link
        href="/admin"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.4rem",
          fontWeight: 400,
          letterSpacing: "0.05em",
          color: "var(--color-ink)",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        The Castalia Chronicles
        <span
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            color: "var(--color-gold)",
            textTransform: "uppercase",
            marginLeft: "0.75rem",
            verticalAlign: "middle",
          }}
        >
          Admin
        </span>
      </Link>

      {/* Navigation — always visible, no hamburger */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          flex: 1,
        }}
        aria-label="Admin navigation"
      >
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                padding: "0.35rem 0.9rem",
                borderRadius: "3px",
                color: active ? "var(--color-gold)" : "var(--color-ink-muted)",
                textDecoration: "none",
                background: active
                  ? "rgba(201,168,76,0.08)"
                  : "transparent",
                transition: "color 0.15s, background 0.15s",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right side: username + logout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            color: "var(--color-ink-faint)",
            letterSpacing: "0.04em",
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
              padding: "0.3rem 0.8rem",
              color: "var(--color-ink-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
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
    </header>
  );
}
