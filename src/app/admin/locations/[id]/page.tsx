import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import LocationForm from "./LocationForm";

export default async function LocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const location = await prisma.location.findFirst({ where: { id, universeId } });
  if (!location) notFound();

  return <LocationForm location={location} />;
}
