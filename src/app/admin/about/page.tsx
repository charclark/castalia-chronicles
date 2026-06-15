import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AboutEditor from "./AboutEditor";

export default async function AdminAboutPage() {
  const session = await getSession();
  if (!session?.isSuperAdmin) redirect("/admin");

  const settings = await prisma.siteSettings.findFirst({
    where: { id: "singleton" },
    select: { eyebrow: true, headline: true, bio: true, photoData: true },
  });

  return (
    <AboutEditor
      initialEyebrow={settings?.eyebrow ?? null}
      initialHeadline={settings?.headline ?? null}
      initialBio={settings?.bio ?? null}
      hasPhoto={!!settings?.photoData}
    />
  );
}
