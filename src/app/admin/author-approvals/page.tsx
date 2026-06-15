import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ApprovalsClient from "./ApprovalsClient";

export const dynamic = "force-dynamic";

export default async function AuthorApprovalsPage() {
  const session = await getSession();
  if (!session?.isSuperAdmin) redirect("/admin");

  const [profiles, joinRequests] = await Promise.all([
    prisma.authorProfile.findMany({
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
    }),
    prisma.joinRequest.findMany({
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        requestedUsername: true,
        genres: true,
        aboutYou: true,
        existingWorkLink: true,
        howDidYouHear: true,
        confirmedAge: true,
        confirmedOriginalAuthor: true,
        confirmedPlagiarism: true,
        confirmedApproval: true,
        confirmedPersonalUse: true,
        confirmedRightToRefuse: true,
        confirmedTerms: true,
        termsVersion: true,
        ipAddress: true,
        submittedAt: true,
        status: true,
        reviewedAt: true,
      },
    }),
  ]);

  return (
    <div style={{ maxWidth: "860px" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.4rem" }}>
        Author Approvals
      </h2>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2.5rem" }}>
        Review and approve author profiles and join requests.
      </p>

      <ApprovalsClient
        profiles={profiles.map((p) => ({
          ...p,
          hasPhoto: !!p.photoData,
          photoData: undefined,
          submittedAt: p.submittedAt.toISOString(),
          approvedAt: p.approvedAt?.toISOString() ?? null,
        }))}
        joinRequests={joinRequests.map((r) => ({
          ...r,
          submittedAt: r.submittedAt.toISOString(),
          reviewedAt: r.reviewedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
