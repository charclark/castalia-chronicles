import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AddUserForm from "./AddUserForm";
import UserList from "./UserList";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) return null;

  if (session.isSuperAdmin) {
    // Char sees the full user list and management controls
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, username: true, isSuperAdmin: true, createdAt: true },
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
          Manage user accounts and universe access.
        </p>

        <UserList users={users} currentUserId={session.userId} />
        <AddUserForm />
      </div>
    );
  }

  // Regular users see only their own info
  const self = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { username: true, createdAt: true },
  });

  return (
    <div style={{ maxWidth: "520px" }}>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.4rem",
        }}
      >
        My Account
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--color-ink-faint)",
          marginBottom: "2.5rem",
          fontStyle: "italic",
        }}
      >
        Your account details.
      </p>

      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          padding: "1.75rem",
        }}
      >
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.6rem 1.5rem" }}>
          {[
            ["Username", self?.username ?? "—"],
            [
              "Member since",
              self?.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }) ?? "—",
            ],
          ].map(([label, value]) => (
            <>
              <dt
                key={`dt-${label}`}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.82rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-muted)",
                  paddingTop: "0.15rem",
                }}
              >
                {label}
              </dt>
              <dd
                key={`dd-${label}`}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  color: "var(--color-ink)",
                  margin: 0,
                }}
              >
                {value}
              </dd>
            </>
          ))}
        </dl>
        <p
          style={{
            marginTop: "1.5rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.88rem",
            color: "var(--color-ink-faint)",
            fontStyle: "italic",
          }}
        >
          To change your password, go to{" "}
          <a
            href="/admin/settings"
            style={{ color: "var(--color-gold)", textDecoration: "none" }}
          >
            Settings
          </a>
          .
        </p>
      </div>
    </div>
  );
}
