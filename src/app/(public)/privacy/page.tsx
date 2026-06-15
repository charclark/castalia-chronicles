import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — WriteWright",
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(1rem, 2vw, 1.2rem)",
  fontWeight: 400,
  letterSpacing: "0.04em",
  color: "var(--color-ink)",
  marginBottom: "0.6rem",
  marginTop: "0",
};

const pStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  lineHeight: 1.8,
  color: "var(--color-ink-muted)",
  marginBottom: "0",
};

const liStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  lineHeight: 1.8,
  color: "var(--color-ink-muted)",
};

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.25rem" }}>
      <h2 style={h2Style}>{num}. {title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: "1.4rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {items.map((item, i) => <li key={i} style={liStyle}>{item}</li>)}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 58px)",
        padding: "clamp(3rem, 6vw, 5rem) 1.5rem",
        background: "var(--color-bg)",
      }}
    >
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            fontFamily: "var(--font-body)", fontSize: "0.85rem",
            color: "var(--color-ink-faint)", textDecoration: "none",
            letterSpacing: "0.04em", marginBottom: "2rem",
          }}
        >
          ← Home
        </Link>

        {/* Page header */}
        <div style={{ marginBottom: "clamp(2.5rem, 5vw, 3.5rem)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem" }}>
            WriteWright
          </p>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 400, letterSpacing: "0.04em", color: "var(--color-ink)", lineHeight: 1.1, marginBottom: "0.6rem" }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)" }}>
            Last Updated: June 2026
          </p>
          <div aria-hidden style={{ width: "48px", height: "1px", background: "var(--color-gold-dim)", marginTop: "1.25rem" }} />
        </div>

        <Section num="1" title="Who We Are">
          <p style={pStyle}>
            WriteWright is an independent author platform operated by Charlotte Clark, based in Vermont, USA. We take your privacy seriously and collect only what we need to operate the platform.
          </p>
        </Section>

        <Section num="2" title="Information We Collect">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <p style={{ ...pStyle, color: "var(--color-ink)", marginBottom: "0.4rem" }}>When you register:</p>
              <BulletList items={[
                "Your username and encrypted password",
                "Your email address (if provided)",
                "Your agreement to these Terms and your age confirmation (18+)",
              ]} />
            </div>
            <div>
              <p style={{ ...pStyle, color: "var(--color-ink)", marginBottom: "0.4rem" }}>When you use the platform:</p>
              <BulletList items={[
                "Creative content you generate — universes, characters, locations, works, storyline ideas, notes, and any other materials",
                "Your author profile information if you choose to submit one",
                "Read statistics associated with your published content",
              ]} />
            </div>
            <div>
              <p style={{ ...pStyle, color: "var(--color-ink)", marginBottom: "0.4rem" }}>Automatically collected:</p>
              <BulletList items={[
                "Basic usage data (page views, read counts) to help us maintain and improve the platform",
                "Session data necessary to keep you logged in",
              ]} />
            </div>
            <div>
              <p style={{ ...pStyle, color: "var(--color-ink)", marginBottom: "0.4rem" }}>What we do NOT collect:</p>
              <BulletList items={[
                "Payment information (we do not process payments)",
                "Social media account data",
                "Location data beyond what you voluntarily provide",
                "Third-party advertising or tracking data of any kind",
              ]} />
            </div>
          </div>
        </Section>

        <Section num="3" title="How We Use Your Information">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <div>
              <p style={{ ...pStyle, marginBottom: "0.4rem" }}>We use your information solely to:</p>
              <BulletList items={[
                "Create and maintain your account",
                "Display your approved public content on the viewer side of WriteWright",
                "Send platform-related communications if you opt in to updates",
                "Allow the platform creator to review and approve submitted content",
                "Maintain platform security and prevent abuse",
              ]} />
            </div>
            <p style={pStyle}>
              We do not sell, trade, rent, or share your personal information with any third party for any reason, with the exception of legal obligations described below.
            </p>
          </div>
        </Section>

        <Section num="4" title="Your Content">
          <p style={pStyle}>
            All creative content you submit remains yours. We store it solely to provide the platform service. If you delete your content or your account is closed, your content is removed from the platform. We do not retain deleted content in backups beyond a reasonable operational period.
          </p>
        </Section>

        <Section num="5" title="Passwords & Security">
          <p style={pStyle}>
            All passwords are encrypted using industry-standard hashing (bcrypt). We never store plain-text passwords and we never have access to your actual password. We recommend using a strong, unique password for your WriteWright account. You are responsible for keeping your credentials secure.
          </p>
        </Section>

        <Section num="6" title="Cookies">
          <p style={pStyle}>
            WriteWright uses only essential session cookies required to keep you logged in and maintain your preferences. We do not use advertising cookies, tracking cookies, analytics cookies, or third-party cookies of any kind.
          </p>
        </Section>

        <Section num="7" title="Data Retention">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <p style={pStyle}>
              We retain your account and content data for as long as your account is active. When an account is deleted or removed, associated personal data and content is deleted from our systems. We do not maintain long-term archives of deleted user data beyond standard operational backup periods.
            </p>
            <p style={pStyle}>
              In the event of permanent platform closure, registered authors will receive a minimum of 14 days notice and continued access to the backup feature before any data deletion occurs.
            </p>
          </div>
        </Section>

        <Section num="8" title="Legal Disclosures">
          <p style={pStyle}>
            We may disclose your information if required to do so by law, court order, or government authority, or if we believe in good faith that disclosure is necessary to protect the rights, property, or safety of WriteWright, its users, or the public — including in cases of reported CSAM or violations of the Take It Down Act (2025).
          </p>
        </Section>

        <Section num="9" title="Children's Privacy">
          <p style={pStyle}>
            WriteWright is intended for users 18 years of age and older. We do not knowingly collect information from anyone under 18. If we become aware that a user is under 18, their account will be removed immediately.
          </p>
        </Section>

        <Section num="10" title="Your Rights">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <div>
              <p style={{ ...pStyle, marginBottom: "0.4rem" }}>You have the right to:</p>
              <BulletList items={[
                "Access the content and data associated with your account",
                "Request correction of inaccurate information",
                "Request deletion of your account and all associated data",
                "Download a backup copy of your work at any time using the platform's built-in backup feature",
              ]} />
            </div>
            <p style={pStyle}>To exercise any of these rights, use the Feedback feature on the Platform.</p>
          </div>
        </Section>

        <Section num="11" title="Third-Party Links">
          <p style={pStyle}>
            Published book listings on WriteWright may contain links to third-party retail sites (such as Amazon, Gumroad, or others). We are not responsible for the privacy practices, content, or security of those external sites. We encourage you to review their privacy policies before making any purchases.
          </p>
        </Section>

        <Section num="12" title="Vermont Residents">
          <p style={pStyle}>
            This platform is operated from Vermont. We comply with applicable Vermont privacy laws. We do not sell personal data.
          </p>
        </Section>

        <Section num="13" title="Changes to This Policy">
          <p style={pStyle}>
            We may update this Privacy Policy at any time. We will make reasonable efforts to notify users of material changes. Continued use of the platform after changes are posted constitutes your acceptance of the updated policy.
          </p>
        </Section>

        <Section num="14" title="Contact">
          <p style={pStyle}>
            For privacy-related questions, data requests, or concerns, use the Feedback feature on the Platform.
          </p>
        </Section>

        {/* Footer nav */}
        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/terms" style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", textDecoration: "none" }}>
            Terms of Service
          </Link>
          <Link href="/" style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", textDecoration: "none" }}>
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
