import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <PublicNav />
      <div style={{ flex: 1 }}>{children}</div>
      <PublicFooter />
    </div>
  );
}
