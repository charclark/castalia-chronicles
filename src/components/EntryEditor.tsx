"use client";

import { useActionState, useTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EditorState = { error?: string; success?: string } | null;
type SaveAction = (prev: EditorState, formData: FormData) => Promise<EditorState>;
type DeleteAction = (id: string) => Promise<void>;

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.65rem 0.85rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "1.05rem",
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s",
};

export default function EntryEditor({
  id,
  title: initialTitle,
  content: initialContent,
  backHref,
  saveAction,
  deleteAction,
  typeName,
  readOnly = false,
}: {
  id?: string;           // undefined = new entry
  title?: string;
  content?: string | null;
  backHref: string;
  saveAction: SaveAction;
  deleteAction?: DeleteAction;
  typeName: string;      // e.g. "Idea", "Note"
  readOnly?: boolean;
}) {
  const [formKey, setFormKey] = useState(0);
  const [state, action, savePending] = useActionState(saveAction, null);
  const [deletePending, startDelete] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (isNew && state?.success) {
      setFormKey((k) => k + 1);
      router.refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleDelete() {
    if (
      !window.confirm(
        `Delete this ${typeName.toLowerCase()}? This cannot be undone.`
      )
    )
      return;
    startDelete(async () => {
      await deleteAction!(id!);
    });
  }

  const isNew = !id;

  return (
    <div style={{ maxWidth: "760px" }}>
      {/* Back link */}
      <button
        onClick={() => router.back()}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          fontSize: "0.88rem",
          color: "var(--color-ink-faint)",
          padding: 0,
          marginBottom: "1.75rem",
          letterSpacing: "0.04em",
        }}
      >
        ← Back
      </button>

      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.3rem",
        }}
      >
        {isNew ? `New ${typeName}` : initialTitle || typeName}
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginBottom: "2rem",
        }}
      >
        {isNew ? `Add a new ${typeName.toLowerCase()} to this universe.` : `Edit ${typeName.toLowerCase()}.`}
      </p>

      {/* Status messages */}
      {state?.error && (
        <div
          role="alert"
          style={{
            background: "rgba(139,38,53,0.15)",
            border: "1px solid var(--color-crimson-dim)",
            borderRadius: "3px",
            padding: "0.7rem 1rem",
            color: "#d4848e",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            marginBottom: "1.25rem",
          }}
        >
          {state.error}
        </div>
      )}
      {state?.success && (
        <div
          role="status"
          style={{
            background: "rgba(76,139,64,0.12)",
            border: "1px solid rgba(76,139,64,0.35)",
            borderRadius: "3px",
            padding: "0.7rem 1rem",
            color: "#8bc98d",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            marginBottom: "1.25rem",
          }}
        >
          {state.success}
        </div>
      )}

      <form key={formKey} action={action} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {id && <input type="hidden" name="id" value={id} />}

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label
            htmlFor="entry-title"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-ink-muted)",
            }}
          >
            Title *
          </label>
          <input
            id="entry-title"
            name="title"
            type="text"
            defaultValue={initialTitle ?? ""}
            required
            maxLength={200}
            autoFocus={isNew}
            style={inputStyle}
          />
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label
            htmlFor="entry-content"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-ink-muted)",
            }}
          >
            Content
          </label>
          <textarea
            id="entry-content"
            name="content"
            defaultValue={initialContent ?? ""}
            rows={14}
            style={{
              ...inputStyle,
              resize: "vertical",
              lineHeight: "1.7",
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
            }}
            placeholder="Write freely…"
          />
        </div>

        {/* Actions */}
        {!readOnly && (
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              paddingTop: "0.5rem",
            }}
          >
            <button
              type="submit"
              disabled={savePending}
              style={{
                background: savePending ? "var(--color-border)" : "var(--color-crimson)",
                border: "none",
                borderRadius: "3px",
                padding: "0.65rem 1.4rem",
                color: "var(--color-ink)",
                fontFamily: "var(--font-heading)",
                fontSize: "1rem",
                letterSpacing: "0.08em",
                cursor: savePending ? "default" : "pointer",
              }}
            >
              {savePending ? "Saving…" : isNew ? `Create ${typeName}` : "Save Changes"}
            </button>

            {!isNew && deleteAction && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletePending}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-crimson-dim)",
                  borderRadius: "3px",
                  padding: "0.6rem 1.1rem",
                  color: "#d4848e",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.88rem",
                  cursor: deletePending ? "default" : "pointer",
                  marginLeft: "auto",
                }}
              >
                {deletePending ? "Deleting…" : `Delete ${typeName}`}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
