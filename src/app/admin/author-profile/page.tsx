import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AuthorProfileEditor from "./AuthorProfileEditor";

export const dynamic = "force-dynamic";

export default async function AuthorProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const profile = await prisma.authorProfile.findUnique({
    where: { userId: session.userId },
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
    },
  });

  return (
    <AuthorProfileEditor
      userId={session.userId}
      initialEyebrow={profile?.eyebrowText ?? null}
      initialHeadline={profile?.headline ?? null}
      initialBodyText={profile?.bodyText ?? null}
      hasPhoto={!!profile?.photoData}
      status={profile?.status ?? null}
      submittedAt={profile?.submittedAt?.toISOString() ?? null}
      approvedAt={profile?.approvedAt?.toISOString() ?? null}
      rejectionNote={profile?.rejectionNote ?? null}
    />
  );
}
