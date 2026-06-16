import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ApprovalsClient from "./ApprovalsClient";

export const dynamic = "force-dynamic";

export default async function AuthorApprovalsPage() {
  const session = await getSession();
  if (!session?.isSuperAdmin) redirect("/admin");

  const [profiles, joinRequests, freeReadSubmissions, discoverBooksSubmissions] = await Promise.all([
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
        rejectionNote: true,
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
        rejectionNote: true,
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
        rejectionNote: true,
        work: { select: { id: true, title: true, type: true, content: true } },
        user: { select: { id: true, username: true } },
      },
    }),
    prisma.discoverBooksSubmission.findMany({
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        bookTitle: true,
        authorName: true,
        coverBgIndex: true,
        coverImageData: true,
        purchaseUrl: true,
        purchaseLinkText: true,
        description: true,
        contentRating: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        publishedAt: true,
        rejectionNote: true,
        work: { select: { id: true, title: true } },
        user: { select: { id: true, username: true } },
      },
    }),
  ]);

  // For chapter titles + content on "chapters" submissions
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
        select: { id: true, title: true, content: true },
      })
    : [];
  const chapterMap = Object.fromEntries(chapters.map((c) => [c.id, c.title]));
  const chapterContent = Object.fromEntries(chapters.map((c) => [c.id, c.content ?? ""]));

  return (
    <div style={{ maxWidth: "860px" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.4rem" }}>
        Author Approvals
      </h2>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2.5rem" }}>
        Review and approve author profiles, join requests, Start Reading submissions, and Discover Books listings.
      </p>

      <ApprovalsClient
        profiles={profiles.map((p) => ({
          ...p,
          hasPhoto: !!p.photoData,
          photoData: undefined,
          submittedAt: p.submittedAt.toISOString(),
          approvedAt: p.approvedAt?.toISOString() ?? null,
          rejectionNote: p.rejectionNote ?? null,
        }))}
        joinRequests={joinRequests.map((r) => ({
          ...r,
          submittedAt: r.submittedAt.toISOString(),
          reviewedAt: r.reviewedAt?.toISOString() ?? null,
          rejectionNote: r.rejectionNote ?? null,
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
          rejectionNote: s.rejectionNote ?? null,
          work: { id: s.work.id, title: s.work.title, type: s.work.type, content: s.work.content ?? "" },
          user: s.user,
          chapterMap,
          chapterContent,
        }))}
        discoverBooksSubmissions={discoverBooksSubmissions.map((s) => ({
          id: s.id,
          bookTitle: s.bookTitle,
          authorName: s.authorName,
          coverBgIndex: s.coverBgIndex,
          hasCoverImage: !!s.coverImageData,
          purchaseUrl: s.purchaseUrl,
          purchaseLinkText: s.purchaseLinkText,
          description: s.description,
          contentRating: s.contentRating,
          status: s.status,
          submittedAt: s.submittedAt.toISOString(),
          rejectionNote: s.rejectionNote ?? null,
          work: s.work,
          user: s.user,
          isReplacing: s.status === "pending" && !!s.publishedAt,
        }))}
      />
    </div>
  );
}
