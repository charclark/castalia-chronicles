import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import OpenCountIncrementer from "./OpenCountIncrementer";

export const dynamic = "force-dynamic";

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const work = await prisma.work.findFirst({
    where: { id, status: "published", publishMode: "whole" },
    select: { id: true, title: true, type: true, content: true, publishedAt: true },
  });

  if (!work) notFound();

  return (
    <main
      style={{
        minHeight: "calc(100vh - 58px)",
        background: "var(--color-bg)",
        padding: "clamp(2.5rem, 6vw, 5rem) 1.5rem",
      }}
    >
      <OpenCountIncrementer workId={id} />

      <article style={{ maxWidth: "680px", margin: "0 auto" }}>
        {/* Back link */}
        <Link
          href="/free-read"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.88rem",
            color: "var(--color-ink-faint)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "2rem",
          }}
        >
          ← Free Read
        </Link>

        {/* Title block */}
        <header style={{ marginBottom: "3rem" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.72rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-gold)",
              marginBottom: "0.6rem",
            }}
          >
            {work.type === "book" ? "Novel" : "Short Story"}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 400,
              color: "var(--color-ink)",
              letterSpacing: "0.04em",
              lineHeight: 1.15,
              marginBottom: "1rem",
            }}
          >
            {work.title}
          </h1>
          <div
            aria-hidden
            style={{
              width: "48px",
              height: "1px",
              background: "var(--color-gold-dim)",
            }}
          />
          {work.publishedAt && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.78rem",
                color: "var(--color-ink-faint)",
                marginTop: "0.75rem",
                fontStyle: "italic",
              }}
            >
              Published{" "}
              {work.publishedAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </header>

        {/* Content */}
        {work.content ? (
          <div className="tiptap-writing-area">
            <div
              className="tiptap"
              dangerouslySetInnerHTML={{ __html: work.content }}
            />
          </div>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              fontStyle: "italic",
              color: "var(--color-ink-faint)",
            }}
          >
            Content coming soon.
          </p>
        )}

        {/* Footer ornament */}
        <div
          aria-hidden
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            marginTop: "4rem",
            marginBottom: "2rem",
          }}
        >
          <span
            style={{
              display: "block",
              width: "60px",
              height: "1px",
              background: "linear-gradient(to right, transparent, var(--color-border-light))",
            }}
          />
          <span style={{ color: "var(--color-gold)", fontSize: "0.65rem", opacity: 0.8 }}>
            ✦
          </span>
          <span
            style={{
              display: "block",
              width: "60px",
              height: "1px",
              background: "linear-gradient(to left, transparent, var(--color-border-light))",
            }}
          />
        </div>

        <Link
          href="/free-read"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.88rem",
            color: "var(--color-ink-faint)",
            textDecoration: "none",
          }}
        >
          ← Back to Free Read
        </Link>
      </article>
    </main>
  );
}
