"use client";

import { useTransition } from "react";
import { deleteMailingListEntry } from "@/app/actions/inbox";

type Entry = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

export default function MailingListClient({ entries }: { entries: Entry[] }) {
  return (
    <div>
      {entries.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--color-ink-faint)",
            fontStyle: "italic",
            padding: "2rem 0",
          }}
        >
          No subscribers yet.
        </p>
      ) : (
        <div
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          {entries.map((entry, i) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              isLast={i === entries.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryRow({ entry, isLast }: { entry: Entry; isLast: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        `Remove ${entry.email} from the mailing list? This cannot be undone.`
      )
    )
      return;
    startTransition(() => deleteMailingListEntry(entry.id));
  }

  const date = entry.createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.8rem 1.25rem",
        borderBottom: isLast ? "none" : "1px solid var(--color-border)",
        opacity: pending ? 0.5 : 1,
        transition: "opacity 0.15s",
        gap: "1rem",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.95rem",
            color: "var(--color-ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {entry.email}
        </p>
        {entry.name && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              color: "var(--color-ink-faint)",
            }}
          >
            {entry.name}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            color: "var(--color-ink-faint)",
            whiteSpace: "nowrap",
          }}
        >
          {date}
        </span>
        <button
          onClick={handleDelete}
          disabled={pending}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            color: "var(--color-ink-faint)",
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "3px",
            padding: "0.2rem 0.6rem",
            cursor: pending ? "default" : "pointer",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!pending) {
              e.currentTarget.style.color = "#d4848e";
              e.currentTarget.style.borderColor = "rgba(139,38,53,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-ink-faint)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
