import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AddUserForm from "./AddUserForm";
import UserList from "./UserList";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isSuperAdmin) redirect("/admin");

  {
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
}
