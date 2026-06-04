import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch all universes for the selector
  const universes = await prisma.universe.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  // Resolve the currently selected universe from cookie
  const cookieStore = await cookies();
  const cookieId = cookieStore.get("selected-universe")?.value ?? null;
  const currentUniverseId =
    cookieId && universes.some((u) => u.id === cookieId)
      ? cookieId
      : (universes[0]?.id ?? null);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AdminNav
        username={session.username}
        universes={universes}
        currentUniverseId={currentUniverseId}
      />
      <main
        style={{
          flex: 1,
          padding: "2.5rem 2rem",
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
