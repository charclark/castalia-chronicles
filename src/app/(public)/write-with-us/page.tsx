import Link from "next/link";
import WriteWithUsForm from "./WriteWithUsForm";

export const metadata = {
  title: "Write With Us — WriteWright",
};

export default function WriteWithUsPage() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 58px)",
        padding: "clamp(3rem, 6vw, 5rem) 1.5rem",
        background:
          "radial-gradient(ellipse at 100% 0%, rgba(139,38,53,0.08) 0%, transparent 50%)," +
          "var(--color-bg)",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            fontFamily: "var(--font-body)", fontSize: "0.85rem",
            color: "var(--color-ink-faint)", textDecoration: "none",
            letterSpacing: "0.04em", marginBottom: "2.5rem",
          }}
        >
          ← Home
        </Link>

        {/* Header */}
        <div style={{ marginBottom: "clamp(2.5rem, 5vw, 3.5rem)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem" }}>
            Join WriteWright
          </p>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 400, letterSpacing: "0.04em", color: "var(--color-ink)", lineHeight: 1.1, marginBottom: "1.25rem" }}>
            Write With Us
          </h1>
          <div aria-hidden style={{ width: "48px", height: "1px", background: "var(--color-gold-dim)", marginBottom: "1.5rem" }} />
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(0.95rem, 1.8vw, 1.05rem)", lineHeight: 1.8, color: "var(--color-ink-muted)", maxWidth: "600px" }}>
            WriteWright is a curated platform for independent authors. Your work is yours — always. Everything you publish here requires approval before it goes live, and we&apos;re selective by design. If you&apos;re serious about your writing and ready to share it with readers who are hungry for something real, we&apos;d love to hear from you. You must be 18 or older to apply.
          </p>
        </div>

        {/* Form */}
        <WriteWithUsForm />
      </div>
    </main>
  );
}
