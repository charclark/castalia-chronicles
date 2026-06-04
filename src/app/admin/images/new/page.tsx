import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ImageUploader from "./ImageUploader";

export default async function NewImagePage() {
  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  return <ImageUploader />;
}
