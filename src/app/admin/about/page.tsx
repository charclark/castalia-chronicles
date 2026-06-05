import { prisma } from "@/lib/prisma";
import AboutEditor from "./AboutEditor";

export default async function AdminAboutPage() {
  const settings = await prisma.siteSettings.findFirst({
    where: { id: "singleton" },
    select: { bio: true, photoData: true },
  });

  return (
    <AboutEditor
      initialBio={settings?.bio ?? null}
      hasPhoto={!!settings?.photoData}
    />
  );
}
