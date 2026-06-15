import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import FeedbackInbox from "./FeedbackInbox";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const session = await getSession();
  const isSuperAdmin = session?.isSuperAdmin ?? false;

  if (isSuperAdmin) {
    // Superadmin: all messages + which users they're shared with
    const [messages, otherUsers] = await Promise.all([
      prisma.feedbackMessage.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          message: true,
          read: true,
          createdAt: true,
          shares: { select: { userId: true, user: { select: { username: true } } } },
        },
      }),
      prisma.user.findMany({
        where: { isSuperAdmin: false },
        orderBy: { username: "asc" },
        select: { id: true, username: true },
      }),
    ]);

    const unreadCount = messages.filter((m) => !m.read).length;

    return (
      <div style={{ maxWidth: "780px" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              fontWeight: 400,
              color: "var(--color-ink)",
              marginBottom: "0.4rem",
            }}
          >
            Feedback Inbox
            {unreadCount > 0 && (
              <span
                style={{
                  display: "inline-block",
                  marginLeft: "0.8rem",
                  background: "var(--color-gold)",
                  color: "#1a1710",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  borderRadius: "10px",
                  padding: "0.15rem 0.55rem",
                  verticalAlign: "middle",
                }}
              >
                {unreadCount}
              </span>
            )}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-ink-faint)",
              fontStyle: "italic",
            }}
          >
            Messages submitted by readers. Reply from your own email client
            using the address shown.
          </p>
        </div>

        <FeedbackInbox
          isSuperAdmin={true}
          messages={messages.map((m) => ({
            ...m,
            shares: m.shares.map((s) => ({ userId: s.userId, username: s.user.username })),
          }))}
          otherUsers={otherUsers}
        />
      </div>
    );
  }

  // Non-superadmin: only messages explicitly shared with this user
  const userId = session?.userId;
  const sharedMessages = userId
    ? await prisma.feedbackMessage.findMany({
        where: { shares: { some: { userId } } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          message: true,
          read: true,
          createdAt: true,
        },
      })
    : [];

  return (
    <div style={{ maxWidth: "780px" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
            fontWeight: 400,
            color: "var(--color-ink)",
            marginBottom: "0.4rem",
          }}
        >
          Feedback
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--color-ink-faint)",
            fontStyle: "italic",
          }}
        >
          Reader feedback shared with you.
        </p>
      </div>

      <FeedbackInbox
        isSuperAdmin={false}
        messages={sharedMessages.map((m) => ({ ...m, shares: [] }))}
        otherUsers={[]}
      />
    </div>
  );
}
