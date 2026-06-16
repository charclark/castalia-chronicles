import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import MyPublicationsClient from "./MyPublicationsClient";

export const dynamic = "force-dynamic";

export default async function MyPublicationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [freeReadSubs, discoverBooksSubs] = await Promise.all([
    prisma.freeReadSubmission.findMany({
      where: { userId: session.userId },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        submissionType: true,
        contentRating: true,
        coverBgIndex: true,
        coverImageData: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        publishedAt: true,
        rejectionNote: true,
        work: { select: { id: true, title: true } },
      },
    }),
    prisma.discoverBooksSubmission.findMany({
      where: { userId: session.userId },
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
      },
    }),
  ]);

  return (
    <div style={{ maxWidth: "860px" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.4rem" }}>
        My Publications
      </h2>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2.5rem" }}>
        All your submissions to the public Start Reading and Discover Books sections.
      </p>
      <MyPublicationsClient
        freeReadSubs={freeReadSubs.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          submissionType: s.submissionType,
          contentRating: s.contentRating,
          coverBgIndex: s.coverBgIndex,
          hasCoverImage: !!s.coverImageData,
          status: s.status,
          submittedAt: s.submittedAt.toISOString(),
          reviewedAt: s.reviewedAt?.toISOString() ?? null,
          publishedAt: s.publishedAt?.toISOString() ?? null,
          rejectionNote: s.rejectionNote ?? null,
          work: s.work,
        }))}
        discoverBooksSubs={discoverBooksSubs.map((s) => ({
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
          reviewedAt: s.reviewedAt?.toISOString() ?? null,
          publishedAt: s.publishedAt?.toISOString() ?? null,
          rejectionNote: s.rejectionNote ?? null,
          work: s.work,
        }))}
      />
    </div>
  );
}
