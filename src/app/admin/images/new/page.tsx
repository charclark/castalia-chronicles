import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getCanEditUniverse } from "@/lib/auth-utils";
import ImageUploader from "./ImageUploader";

export default async function NewImagePage() {
  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const canEdit = await getCanEditUniverse(universeId);
  if (!canEdit) redirect("/admin");

  return <ImageUploader />;
}
