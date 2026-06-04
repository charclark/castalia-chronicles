import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AddUserForm from "./AddUserForm";

export default async function UsersPage() {
  await getSession(); // layout already guards, this is for the data fetch
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, createdAt: true },
  });

  return (
    <div style={{ maxWidth: "700px" }}>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.4rem",
        }}
      >
        Users
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--color-ink-faint)",
          marginBottom: "2.5rem",
          fontStyle: "italic",
        }}
      >
        All admin users have full, equal access.
      </p>

      {/* Existing users */}
      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          padding: "1.75rem",
          marginBottom: "2rem",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.2rem",
            fontWeight: 400,
            color: "var(--color-gold)",
            marginBottom: "1.25rem",
            letterSpacing: "0.04em",
          }}
        >
          Current Users
        </h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {users.map((u) => (
            <li
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.65rem 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  color: "var(--color-ink)",
                }}
              >
                {u.username}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8rem",
                  color: "var(--color-ink-faint)",
                }}
              >
                Added{" "}
                {u.createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Add user form */}
      <AddUserForm />
    </div>
  );
}
