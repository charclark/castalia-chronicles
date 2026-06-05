"use client";

import { useState, useTransition } from "react";
import { deleteUser, adminResetPassword } from "@/app/actions/auth";

type UserRow = {
  id: string;
  username: string;
  isSuperAdmin: boolean;
  createdAt: Date;
};

const inp: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.5rem 0.75rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  outline: "none",
  width: "100%",
};

function ResetPasswordRow({ user }: { user: UserRow }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg({});
    start(async () => {
      const r = await adminResetPassword(user.id, pw);
      if (r.error) setMsg({ err: r.error });
      else { setMsg({ ok: r.success }); setPw(""); setOpen(false); }
    });
  }

  if (!open) return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      style={{
        background: "transparent",
        border: "1px solid var(--color-border)",
        borderRadius: "3px",
        padding: "0.3rem 0.7rem",
        color: "var(--color-ink-muted)",
        fontFamily: "var(--font-body)",
        fontSize: "0.82rem",
        cursor: "pointer",
      }}
    >
      Reset pw
    </button>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="New password"
        required
        autoFocus
        style={{ ...inp, width: "160px" }}
      />
      <button
        type="submit"
        disabled={pending}
        style={{
          background: "var(--color-crimson)",
          border: "none",
          borderRadius: "3px",
          padding: "0.3rem 0.7rem",
          color: "var(--color-ink)",
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
          cursor: "pointer",
        }}
      >
        {pending ? "…" : "Set"}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setPw(""); setMsg({}); }}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--color-ink-faint)",
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
      {msg.err && <span style={{ color: "#d4848e", fontSize: "0.8rem", width: "100%" }}>{msg.err}</span>}
    </form>
  );
}

export default function UserList({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [deletePending, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(user: UserRow) {
    if (!window.confirm(`Delete user "${user.username}"?\n\nThis cannot be undone.`)) return;
    setDeleteError("");
    startDelete(async () => {
      const r = await deleteUser(user.id);
      if (r.error) setDeleteError(r.error);
    });
  }

  return (
    <div
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        padding: "1.75rem",
        marginBottom: "2rem",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.2rem",
          fontWeight: 400,
          color: "var(--color-gold)",
          marginBottom: "1.25rem",
          letterSpacing: "0.04em",
        }}
      >
        Current Users
      </h3>

      {deleteError && (
        <p style={{ color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.88rem", marginBottom: "0.75rem" }}>
          {deleteError}
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {users.map((u) => (
          <li
            key={u.id}
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.5rem 1rem",
              padding: "0.75rem 0",
              borderBottom: "1px solid var(--color-border)",
              opacity: deletePending ? 0.6 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--color-ink)" }}>
                {u.username}
              </span>
              {u.isSuperAdmin && (
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-gold)",
                    border: "1px solid var(--color-gold-dim)",
                    borderRadius: "2px",
                    padding: "0.1rem 0.4rem",
                  }}
                >
                  Super-admin
                </span>
              )}
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)" }}>
                {u.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>

            {/* Actions — not shown for the super-admin row */}
            {!u.isSuperAdmin && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <ResetPasswordRow user={u} />
                <button
                  type="button"
                  onClick={() => handleDelete(u)}
                  disabled={deletePending}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-crimson-dim)",
                    borderRadius: "3px",
                    padding: "0.3rem 0.7rem",
                    color: "#d4848e",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
