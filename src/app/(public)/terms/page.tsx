import Link from "next/link";

export const metadata = {
  title: "Terms of Service — WriteWright",
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

const section = (num: string, title: string, children: React.ReactNode) => (
  <section key={num} style={{ marginBottom: "2.25rem" }}>
    <h2 style={h2Style}>{num}. {title}</h2>
    {children}
  </section>
);

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)" }}>
            Last Updated: June 2026
          </p>
          <div aria-hidden style={{ width: "48px", height: "1px", background: "var(--color-gold-dim)", marginTop: "1.25rem" }} />
        </div>

        {/* Sections */}
        {section("1", "Acceptance of Terms",
          <p style={pStyle}>
            By registering for or using WriteWright (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the Platform. WriteWright is intended for users 18 years of age or older. By registering, you represent that you are at least 18 years old. Accounts found to belong to minors will be terminated immediately.
          </p>
        )}

        {section("2", "About WriteWright",
          <p style={pStyle}>
            WriteWright is an independent platform that provides tools and space for authors to develop, organize, and share their written works. We are not a publisher. We do not acquire, license, or claim ownership rights to any content submitted by authors on this platform.
          </p>
        )}

        {section("3", "Your Content & Your Rights",
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <p style={pStyle}>
              All written works, characters, storylines, world-building materials, and creative content you create on WriteWright belong entirely to you. You retain full copyright and ownership of everything you create here.
            </p>
            <p style={pStyle}>
              By submitting content to WriteWright, you grant WriteWright a limited, non-exclusive, royalty-free license to store, display, and distribute your content solely for the purpose of operating the Platform and making your approved content visible to readers. This license does not transfer ownership and ends when you delete your content or your account is closed.
            </p>
            <p style={pStyle}>
              You represent and warrant that you are the original creator of all content you submit, or that you hold full legal rights to publish it, and that your content does not infringe on the intellectual property rights of any third party.
            </p>
          </div>
        )}

        {section("4", "Content Approval",
          <p style={pStyle}>
            All content published to the public-facing side of WriteWright — including author profiles, free reads, and published book listings — is subject to review and approval by the platform creator before it appears publicly. Submission does not guarantee publication. WriteWright reserves the right to limit, decline, or remove any content at any time, at its sole discretion, without obligation to provide a reason.
          </p>
        )}

        {section("5", "Prohibited Content",
          <div>
            <p style={{ ...pStyle, marginBottom: "0.75rem" }}>You agree not to submit content that:</p>
            <ul style={{ margin: 0, paddingLeft: "1.4rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {[
                "Infringes on the copyright, trademark, or intellectual property of any third party",
                "Contains plagiarized material in any form",
                "Promotes hate speech, discrimination, or violence against any individual or group based on race, ethnicity, religion, gender, sexual orientation, national origin, disability, or any other characteristic",
                "Harasses, threatens, stalks, or defames any person",
                "Contains explicit sexual content involving minors (CSAM) — this is strictly prohibited and will be reported to appropriate authorities",
                "Contains nonconsensual intimate imagery or deepfake pornography of any person (in compliance with the Take It Down Act, 2025)",
                "Constitutes spam, phishing, or malicious code",
                "Violates any applicable local, state, national, or international law",
              ].map((item, i) => (
                <li key={i} style={liStyle}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {section("6", "AI-Generated Content",
          <p style={pStyle}>
            Authors must disclose if any submitted content was generated in whole or in substantial part by artificial intelligence tools. Fully AI-generated works submitted without disclosure may be removed at the platform creator&apos;s discretion. Human-authored works that use AI for editing assistance do not require disclosure.
          </p>
        )}

        {section("7", "Author Responsibility & Indemnification",
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <p style={pStyle}>
              You are solely responsible for all content you submit to WriteWright. WriteWright is not responsible for reviewing content for accuracy, legality, or originality prior to submission. If your content infringes on the rights of others or violates any law, you — not WriteWright — bear full legal and financial responsibility.
            </p>
            <p style={pStyle}>
              You agree to indemnify, defend, and hold harmless WriteWright, its creator, operators, and representatives from any and all claims, damages, losses, liabilities, costs, and legal fees arising from your content, your use of the Platform, or your violation of these Terms.
            </p>
          </div>
        )}

        {section("8", "DMCA Copyright Policy",
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <p style={pStyle}>
              WriteWright respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you believe content on WriteWright infringes your copyright, you may submit a written DMCA takedown notice via the Feedback feature on the Platform.
            </p>
            <p style={pStyle}>
              Your notice must include: (1) identification of the copyrighted work claimed to be infringed; (2) identification of the infringing material and its location on the Platform; (3) your contact information; (4) a statement of good faith belief that the use is unauthorized; (5) a statement under penalty of perjury that the information is accurate and you are authorized to act on behalf of the copyright owner; (6) your physical or electronic signature.
            </p>
            <p style={pStyle}>
              Upon receiving a valid notice, WriteWright will remove or disable access to the allegedly infringing content. Repeat infringers will have their accounts terminated.
            </p>
          </div>
        )}

        {section("9", "Account Security",
          <p style={pStyle}>
            You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify WriteWright immediately via the Feedback feature if you suspect unauthorized access to your account. WriteWright is not liable for losses resulting from unauthorized account access.
          </p>
        )}

        {section("10", "Platform Availability & Data",
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <p style={pStyle}>
              WriteWright is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranty of any kind, express or implied. We make no guarantees of uninterrupted service, data integrity, or fitness for any particular purpose. We are not responsible for data loss, service interruptions, or technical failures of any kind.
            </p>
            <p style={pStyle}>
              We strongly recommend all authors regularly download backup copies of their work using the backup feature available on the platform. Your use of WriteWright is at your own risk.
            </p>
          </div>
        )}

        {section("11", "Limitation of Liability",
          <p style={pStyle}>
            To the maximum extent permitted by applicable law, WriteWright and its creator shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, loss of revenue, or loss of creative work, arising from your use of or inability to use the Platform, even if advised of the possibility of such damages. WriteWright&apos;s total liability to you for any claim shall not exceed the amount you paid to use the Platform in the twelve months preceding the claim.
          </p>
        )}

        {section("12", "Warranty Disclaimer",
          <p style={pStyle}>
            WriteWright makes no representations or warranties regarding the accuracy, reliability, or completeness of any content on the Platform. Content posted by authors reflects the views of those authors only and does not represent the views of WriteWright or its creator.
          </p>
        )}

        {section("13", "Termination",
          <p style={pStyle}>
            WriteWright reserves the right to suspend or terminate any account or remove any content at any time, for any reason, without notice or liability. Users who violate these Terms may be permanently banned from the Platform.
          </p>
        )}

        {section("14", "Platform Discontinuation",
          <p style={pStyle}>
            In the event that WriteWright ceases operations permanently, we will make every reasonable effort to provide registered authors with no less than 14 days advance notice via the Platform and any email address on file. During this period, all author tools and backup features will remain accessible so authors can download and preserve their work. WriteWright is not liable for content lost due to failure to back up during this notice period.
          </p>
        )}

        {section("15", "Governing Law & Dispute Resolution",
          <p style={pStyle}>
            These Terms are governed by the laws of the State of Vermont, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Platform shall be resolved through good-faith negotiation first. If negotiation fails, disputes shall be submitted to binding arbitration in Vermont in accordance with applicable arbitration rules, rather than in court, except that either party may seek injunctive relief in court for intellectual property violations.
          </p>
        )}

        {section("16", "Changes to These Terms",
          <p style={pStyle}>
            WriteWright reserves the right to update these Terms at any time. We will make reasonable efforts to notify registered users of material changes. Continued use of the Platform after changes are posted constitutes your acceptance of the updated Terms.
          </p>
        )}

        {section("17", "Severability",
          <p style={pStyle}>
            If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
          </p>
        )}

        {section("18", "Contact",
          <p style={pStyle}>
            For questions, DMCA notices, or concerns, use the Feedback feature on the Platform.
          </p>
        )}

        {/* Footer nav */}
        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", textDecoration: "none" }}>
            Privacy Policy
          </Link>
          <Link href="/" style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", textDecoration: "none" }}>
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
