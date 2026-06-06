import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import MailingListClient from "./MailingListClient";
import AddSubscriberForm from "./AddSubscriberForm";

export const dynamic = "force-dynamic";

export default async function MailingListPage() {
  const session = await getSession();
  const isSuperAdmin = session?.isSuperAdmin ?? false;

  const entries = await prisma.mailingListEntry.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return (
    <div style={{ maxWidth: "700px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1.5rem",
          marginBottom: "2.5rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              fontWeight: 400,
              color: "var(--color-ink)",
              marginBottom: "0.4rem",
            }}
          >
            Mailing List
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                color: "var(--color-ink-faint)",
                marginLeft: "0.75rem",
                fontWeight: 400,
              }}
            >
              {entries.length} subscriber{entries.length !== 1 ? "s" : ""}
            </span>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-ink-faint)",
              fontStyle: "italic",
            }}
          >
            Emails collected via the Get Updates! popup. Export to use with any
            mailing service.
          </p>
        </div>

        {entries.length > 0 && isSuperAdmin && (
          <a
            href="/api/admin/mailing-list-export"
            download
            style={{
              display: "inline-block",
              fontFamily: "var(--font-heading)",
              fontSize: "0.9rem",
              letterSpacing: "0.06em",
              color: "var(--color-gold)",
              background: "transparent",
              border: "1px solid var(--color-gold-dim)",
              borderRadius: "3px",
              padding: "0.45rem 1rem",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "border-color 0.15s",
            }}
          >
            Export CSV ↓
          </a>
        )}
      </div>

      <MailingListClient entries={entries} />
      <AddSubscriberForm />
    </div>
  );
}
