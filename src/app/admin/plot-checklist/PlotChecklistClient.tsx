"use client";

import { useOptimistic, useActionState, useTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPlotItem,
  togglePlotItem,
  deletePlotItem,
} from "@/app/actions/plot-checklist";

type Item = { id: string; text: string; checked: boolean };

function sortItems(items: Item[]): Item[] {
  return [
    ...items.filter((i) => !i.checked),
    ...items.filter((i) => i.checked),
  ];
}

export default function PlotChecklistClient({
  initialItems,
  canEdit = true,
}: {
  initialItems: Item[];
  canEdit?: boolean;
}) {
  const router = useRouter();

  // Optimistic state — items update instantly on toggle
  const [optimisticItems, updateOptimistic] = useOptimistic(
    sortItems(initialItems),
    (state: Item[], update: { id: string; checked: boolean }) => {
      const updated = state.map((item) =>
        item.id === update.id ? { ...item, checked: update.checked } : item
      );
      return sortItems(updated);
    }
  );

  const [addFormKey, setAddFormKey] = useState(0);
  const [addState, addAction, addPending] = useActionState(createPlotItem, null);
  const [deletingId, startDelete] = useTransition();
  const [togglingId, startToggle] = useTransition();

  useEffect(() => {
    if (addState?.success) {
      setAddFormKey((k) => k + 1);
      router.refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addState]);

  function handleToggle(id: string, checked: boolean) {
    startToggle(async () => {
      updateOptimistic({ id, checked });
      await togglePlotItem(id, checked);
      router.refresh();
    });
  }

  function handleDelete(id: string, text: string) {
    if (!window.confirm(`Remove "${text.slice(0, 60)}"?`)) return;
    startDelete(async () => {
      await deletePlotItem(id);
      router.refresh();
    });
  }

  const unchecked = optimisticItems.filter((i) => !i.checked);
  const checked = optimisticItems.filter((i) => i.checked);

  return (
    <div>
      {/* Add item form — edit access only */}
      {canEdit && (
        <>
          <form
            key={addFormKey}
            action={addAction}
            style={{
              display: "flex",
              gap: "0.6rem",
              marginBottom: "2rem",
              alignItems: "flex-start",
            }}
          >
            <input
              name="text"
              type="text"
              placeholder="Add a plot item…"
              required
              maxLength={500}
              style={{
                flex: 1,
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: "3px",
                padding: "0.6rem 0.85rem",
                color: "var(--color-ink)",
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={addPending}
              style={{
                background: addPending ? "var(--color-border)" : "var(--color-crimson)",
                border: "none",
                borderRadius: "3px",
                padding: "0.6rem 1.1rem",
                color: "var(--color-ink)",
                fontFamily: "var(--font-heading)",
                fontSize: "0.95rem",
                letterSpacing: "0.06em",
                cursor: addPending ? "default" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {addPending ? "Adding…" : "Add"}
            </button>
          </form>

          {addState?.error && (
            <p style={{ color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.88rem", marginBottom: "1rem" }}>
              {addState.error}
            </p>
          )}
        </>
      )}

      {/* Empty state */}
      {optimisticItems.length === 0 && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--color-ink-faint)",
            fontStyle: "italic",
            textAlign: "center",
            padding: "3rem 0",
          }}
        >
          No plot items yet. Add one above.
        </p>
      )}

      {/* Unchecked items */}
      {unchecked.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {unchecked.map((item) => (
            <li
              key={item.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "0.6rem 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {canEdit ? (
                <button
                  onClick={() => handleToggle(item.id, true)}
                  aria-label="Mark complete"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-border-light)",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    flexShrink: 0,
                    cursor: "pointer",
                    marginTop: "3px",
                    transition: "border-color 0.15s",
                    padding: 0,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--color-gold)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--color-border-light)")
                  }
                />
              ) : (
                <span style={{ width: "18px", flexShrink: 0, marginTop: "3px" }} />
              )}
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  color: "var(--color-ink)",
                  flex: 1,
                  lineHeight: 1.55,
                }}
              >
                {item.text}
              </span>
              {canEdit && (
                <button
                  onClick={() => handleDelete(item.id, item.text)}
                  aria-label="Delete item"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-ink-faint)",
                    fontSize: "0.75rem",
                    padding: "0.2rem",
                    flexShrink: 0,
                    marginTop: "2px",
                    opacity: 0.5,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Checked items — small, grey, at bottom */}
      {checked.length > 0 && (
        <>
          {unchecked.length > 0 && (
            <div
              style={{
                height: "1px",
                background: "var(--color-border)",
                margin: "1.5rem 0 0.75rem",
              }}
            />
          )}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {checked.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.35rem 0",
                }}
              >
                {canEdit ? (
                  <button
                    onClick={() => handleToggle(item.id, false)}
                    aria-label="Mark incomplete"
                    style={{
                      background: "var(--color-border)",
                      border: "1px solid var(--color-border-light)",
                      borderRadius: "50%",
                      width: "14px",
                      height: "14px",
                      flexShrink: 0,
                      cursor: "pointer",
                      marginTop: "2px",
                      padding: 0,
                      fontSize: "8px",
                      color: "var(--color-ink-faint)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                    title="Uncheck"
                  >
                    ✓
                  </button>
                ) : (
                  <span style={{ width: "14px", flexShrink: 0, marginTop: "2px" }} />
                )}
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8rem",
                    color: "var(--color-ink-faint)",
                    flex: 1,
                    textDecoration: "line-through",
                    textDecorationColor: "var(--color-border-light)",
                  }}
                >
                  {item.text}
                </span>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(item.id, item.text)}
                    aria-label="Delete item"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-ink-faint)",
                      fontSize: "0.65rem",
                      padding: "0.15rem",
                      flexShrink: 0,
                      opacity: 0.4,
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
