export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1.5rem",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(139,38,53,0.18) 0%, transparent 60%), var(--color-bg)",
      }}
    >
      {/* Decorative rule */}
      <div
        aria-hidden
        style={{
          width: "1px",
          height: "80px",
          background:
            "linear-gradient(to bottom, transparent, var(--color-gold), transparent)",
          marginBottom: "3rem",
        }}
      />

      {/* Site title */}
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
          fontWeight: 400,
          letterSpacing: "0.06em",
          textAlign: "center",
          color: "var(--color-ink)",
          lineHeight: 1.1,
          marginBottom: "1.25rem",
        }}
      >
        The Castalia Chronicles
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
          fontStyle: "italic",
          color: "var(--color-gold)",
          letterSpacing: "0.12em",
          textAlign: "center",
          marginBottom: "3rem",
          textTransform: "lowercase",
        }}
      >
        Tales of the immortal and the untamed
      </p>

      {/* Decorative rule */}
      <div
        aria-hidden
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        <span
          style={{
            display: "block",
            width: "60px",
            height: "1px",
            background: "var(--color-border-light)",
          }}
        />
        <span style={{ color: "var(--color-gold)", fontSize: "0.7rem" }}>
          ✦
        </span>
        <span
          style={{
            display: "block",
            width: "60px",
            height: "1px",
            background: "var(--color-border-light)",
          }}
        />
      </div>

      {/* Author attribution */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "1rem",
          color: "var(--color-ink-faint)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        Alexandra Castalia
      </p>
    </main>
  );
}
