import "server-only";
import { cookies } from "next/headers";

export async function getCurrentUniverseId(): Promise<string> {
  const cookieStore = await cookies();
  const id = cookieStore.get("selected-universe")?.value;
  if (!id) throw new Error("No universe selected.");
  return id;
}
