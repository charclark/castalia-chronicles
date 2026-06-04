import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import LocationForm from "../[id]/LocationForm";

export default async function NewLocationPage() {
  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  return <LocationForm />;
}
