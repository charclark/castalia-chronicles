import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCanEditUniverse } from "@/lib/auth-utils";
import PlotChecklistClient from "./PlotChecklistClient";

export default async function PlotChecklistPage() {
  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const [items, canEdit] = await Promise.all([
    prisma.plotItem.findMany({
      where: { universeId },
      orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
    }),
    getCanEditUniverse(universeId),
  ]);

  return (
    <div style={{ maxWidth: "680px" }}>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.4rem",
        }}
      >
        Plot Checklist
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginBottom: "2rem",
        }}
      >
        Shared for this universe. Check off items as they are handled.
      </p>

      <PlotChecklistClient
        initialItems={items.map((i) => ({
          id: i.id,
          text: i.text,
          checked: i.checked,
        }))}
        canEdit={canEdit}
      />
    </div>
  );
}
