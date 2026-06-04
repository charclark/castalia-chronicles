import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import UniverseManager from "./UniverseManager";

export default async function UniversesPage() {
  const universes = await prisma.universe.findMany({
    orderBy: { createdAt: "asc" },
  });

  const cookieStore = await cookies();
  const selectedId = cookieStore.get("selected-universe")?.value ?? null;

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.4rem",
        }}
      >
        Universes
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginBottom: "2.5rem",
        }}
      >
        Each universe is a fully isolated world — its own characters, locations,
        and stories.
      </p>

      <UniverseManager universes={universes} selectedId={selectedId} />
    </div>
  );
}
