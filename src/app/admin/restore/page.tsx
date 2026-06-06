import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import RestoreClient from "./RestoreClient";

export default async function RestorePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isSuperAdmin) redirect("/admin");

  return <RestoreClient />;
}
