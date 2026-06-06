import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  if (!session.isSuperAdmin) return new NextResponse("Forbidden", { status: 403 });

  const entries = await prisma.mailingListEntry.findMany({
    orderBy: { createdAt: "asc" },
    select: { email: true, name: true, createdAt: true },
  });

  const rows = [
    ["Email", "Name", "Signed Up"],
    ...entries.map((e) => [
      e.email,
      e.name ?? "",
      e.createdAt.toISOString().slice(0, 10),
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell);
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(",")
    )
    .join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mailing-list-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
