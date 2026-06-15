import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ApprovalsClient from "./ApprovalsClient";

export const dynamic = "force-dynamic";

export default async function AuthorApprovalsPage() {
  const session = await getSession();
  if (!session?.isSuperAdmin) redirect("/admin");

  const profiles = await prisma.authorProfile.findMany({
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      eyebrowText: true,
      headline: true,
      bodyText: true,
      photoData: true,
      status: true,
      submittedAt: true,
      approvedAt: true,
      user: { select: { id: true, username: true } },
    },
  });

  return (
    <div style={{ maxWidth: "780px" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.4rem" }}>
        Author Approvals
      </h2>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2.5rem" }}>
        Review and approve author profiles for the public Our Authors page.
      </p>

      <ApprovalsClient
        profiles={profiles.map((p) => ({
          ...p,
          hasPhoto: !!p.photoData,
          photoData: undefined,
          submittedAt: p.submittedAt.toISOString(),
          approvedAt: p.approvedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
