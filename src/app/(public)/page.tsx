export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 58px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(3rem, 8vw, 6rem) 1.5rem",
        background:
          "radial-gradient(ellipse at 50% -10%, rgba(139,38,53,0.22) 0%, transparent 58%)," +
          "radial-gradient(ellipse at 80% 80%, rgba(139,38,53,0.07) 0%, transparent 45%)," +
          "var(--color-bg)",
        textAlign: "center",
      }}
    >
      {/* Vertical rule */}
      <div
        aria-hidden
        style={{
          width: "1px",
          height: "clamp(20px, 3vh, 40px)",
          background:
            "linear-gradient(to bottom, transparent, var(--color-gold-dim), transparent)",
          marginBottom: "clamp(0.75rem, 1.5vh, 1.25rem)",
        }}
      />

      {/* Site title */}
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(2.4rem, 7vw, 5.5rem)",
          fontWeight: 400,
          letterSpacing: "0.06em",
          color: "var(--color-ink)",
          lineHeight: 1.05,
          marginBottom: "1.25rem",
          maxWidth: "900px",
        }}
      >
        WriteWright
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(0.95rem, 2.2vw, 1.3rem)",
          fontStyle: "italic",
          color: "var(--color-gold)",
          letterSpacing: "0.14em",
          marginBottom: "clamp(2rem, 5vh, 3.5rem)",
          textTransform: "lowercase",
        }}
      >
        Every universe begins with a single word
      </p>

      {/* Ornament */}
      <div
        aria-hidden
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          marginBottom: "clamp(2rem, 5vh, 3.5rem)",
        }}
      >
        <span
          style={{
            display: "block",
            width: "clamp(40px, 8vw, 80px)",
            height: "1px",
            background:
              "linear-gradient(to right, transparent, var(--color-border-light))",
          }}
        />
        <span style={{ color: "var(--color-gold)", fontSize: "0.65rem", opacity: 0.8 }}>
          ✦
        </span>
        <span
          style={{
            display: "block",
            width: "clamp(40px, 8vw, 80px)",
            height: "1px",
            background:
              "linear-gradient(to left, transparent, var(--color-border-light))",
          }}
        />
      </div>

      {/* Author byline */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(0.8rem, 1.5vw, 0.95rem)",
          color: "var(--color-ink-faint)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom: "clamp(2.5rem, 6vh, 4rem)",
        }}
      >
        A universe for readers. A home for independent authors.
      </p>

      {/* CTA links */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          justifyContent: "center",
        }}
      >
        <a href="/free-read" className="pub-cta-primary">Start Reading</a>
        <a href="/books" className="pub-cta-secondary">Discover Books</a>
        <a href="/write-with-us" className="pub-cta-secondary">Write With Us</a>
      </div>
    </main>
  );
}
