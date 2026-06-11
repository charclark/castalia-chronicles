import { redirect } from "next/navigation";
import { getCanEditUniverse } from "@/lib/auth-utils";
import { getCurrentUniverseId } from "@/lib/universe";
import LocationForm from "../[id]/LocationForm";

export default async function NewLocationPage() {
  const universeId = await getCurrentUniverseId().catch(() => null);
  if (!universeId) redirect("/admin");

  const canEdit = await getCanEditUniverse(universeId);
  if (!canEdit) redirect("/admin");

  return <LocationForm />;
}
