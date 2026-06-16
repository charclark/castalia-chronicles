import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const sub = await prisma.discoverBooksSubmission.findUnique({
    where: { id },
    select: { coverImageData: true },
  });

  if (!sub?.coverImageData) {
    return new Response(null, { status: 404 });
  }

  return new Response(Buffer.from(sub.coverImageData as Uint8Array), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
