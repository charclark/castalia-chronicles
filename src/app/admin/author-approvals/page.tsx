import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ApprovalsClient from "./ApprovalsClient";

export const dynamic = "force-dynamic";

export default async function AuthorApprovalsPage() {
  const session = await getSession();
  if (!session?.isSuperAdmin) redirect("/admin");

  const [profiles, joinRequests, freeReadSubmissions] = await Promise.all([
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
    prisma.freeReadSubmission.findMany({
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        submissionType: true,
        selectedChapterIds: true,
        title: true,
        description: true,
        contentRating: true,
        coverBgIndex: true,
        coverImageData: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        work: { select: { id: true, title: true, type: true } },
        user: { select: { id: true, username: true } },
      },
    }),
  ]);

  // For chapter titles on "chapters" submissions
  const chapterIds: string[] = [];
  for (const sub of freeReadSubmissions) {
    if (sub.submissionType === "chapters" && sub.selectedChapterIds) {
      try {
        const ids = JSON.parse(sub.selectedChapterIds) as string[];
        chapterIds.push(...ids);
      } catch { /* ignore */ }
    }
  }
  const chapters = chapterIds.length
    ? await prisma.chapter.findMany({
        where: { id: { in: chapterIds } },
        select: { id: true, title: true },
      })
    : [];
  const chapterMap = Object.fromEntries(chapters.map((c) => [c.id, c.title]));

  return (
    <div style={{ maxWidth: "860px" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.4rem" }}>
        Author Approvals
      </h2>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2.5rem" }}>
        Review and approve author profiles, join requests, and Start Reading submissions.
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
        freeReadSubmissions={freeReadSubmissions.map((s) => ({
          id: s.id,
          submissionType: s.submissionType,
          selectedChapterIds: s.selectedChapterIds,
          title: s.title,
          description: s.description,
          contentRating: s.contentRating,
          coverBgIndex: s.coverBgIndex,
          hasCoverImage: !!s.coverImageData,
          status: s.status,
          submittedAt: s.submittedAt.toISOString(),
          reviewedAt: s.reviewedAt?.toISOString() ?? null,
          work: s.work,
          user: s.user,
          chapterMap,
        }))}
      />
    </div>
  );
}
