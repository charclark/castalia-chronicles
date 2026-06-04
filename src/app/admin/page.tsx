import { getSession } from "@/lib/session";

export default async function AdminDashboard() {
  const session = await getSession();

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.5rem",
        }}
      >
        Welcome back, {session?.username}.
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginBottom: "3rem",
        }}
      >
        The chronicles await.
      </p>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "var(--color-border)",
          marginBottom: "2.5rem",
        }}
      />

      {/* Placeholder cards — expanded in later stages */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {[
          { label: "Universes", note: "Coming soon" },
          { label: "Feedback Inbox", note: "Coming soon" },
          { label: "Mailing List", note: "Coming soon" },
        ].map(({ label, note }) => (
          <div
            key={label}
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
              padding: "1.5rem",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.3rem",
                fontWeight: 400,
                color: "var(--color-ink)",
                marginBottom: "0.4rem",
              }}
            >
              {label}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                color: "var(--color-ink-faint)",
              }}
            >
              {note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
