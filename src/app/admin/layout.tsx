import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AdminNav username={session.username} />
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
