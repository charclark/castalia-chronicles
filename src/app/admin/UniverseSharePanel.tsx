"use client";

import { useState, useTransition } from "react";
import { shareUniverseAsOwner, revokeUniverseShareAsOwner } from "@/app/actions/universe-access";

type User = { id: string; username: string };
type Access = { userId: string; username: string; permission: "view" | "edit" };

const inp: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.4rem 0.6rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "0.9rem",
  outline: "none",
};

export default function UniverseSharePanel({
  universeId,
  initialAccesses,
  otherUsers,
}: {
  universeId: string;
  initialAccesses: Access[];
  otherUsers: User[];
}) {
  const [accesses, setAccesses] = useState(initialAccesses);
  const [addUserId, setAddUserId] = useState("");
  const [addPermission, setAddPermission] = useState<"view" | "edit">("view");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const grantable = otherUsers.filter((u) => !accesses.some((a) => a.userId === u.id));

  function handleShare() {
    if (!addUserId) return;
    setError("");
    start(async () => {
      const r = await shareUniverseAsOwner(universeId, addUserId, addPermission);
      if (r.error) { setError(r.error); return; }
      const user = otherUsers.find((u) => u.id === addUserId);
      if (!user) return;
      setAccesses((prev) => {
        const exists = prev.find((a) => a.userId === addUserId);
        if (exists) return prev.map((a) => a.userId === addUserId ? { ...a, permission: addPermission } : a);
        return [...prev, { userId: addUserId, username: user.username, permission: addPermission }];
      });
      setAddUserId("");
    });
  }

  function handleRevoke(userId: string, username: string) {
    if (!window.confirm(`Remove ${username}'s access to this universe?`)) return;
    setError("");
    start(async () => {
      const r = await revokeUniverseShareAsOwner(universeId, userId);
      if (r.error) setError(r.error);
      else setAccesses((prev) => prev.filter((a) => a.userId !== userId));
    });
  }

  function handleUpdatePermission(userId: string, permission: "view" | "edit") {
    setError("");
    start(async () => {
      const r = await shareUniverseAsOwner(universeId, userId, permission);
      if (r.error) setError(r.error);
      else setAccesses((prev) => prev.map((a) => a.userId === userId ? { ...a, permission } : a));
    });
  }

  const selectStyle: React.CSSProperties = {
    ...inp,
    cursor: "pointer",
    minWidth: "110px",
  };

  const btnStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid var(--color-border)",
    borderRadius: "3px",
    padding: "0.3rem 0.65rem",
    color: "var(--color-ink-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    cursor: "pointer",
  };

  return (
    <div style={{ opacity: pending ? 0.7 : 1, transition: "opacity 0.15s" }}>
      {/* Current access list */}
      {accesses.length > 0 ? (
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.6rem" }}>
            Currently shared with
          </p>
          {accesses.map((a) => (
            <div
              key={a.userId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--color-border)",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--color-ink)", flex: 1, minWidth: "80px" }}>
                {a.username}
              </span>
              <select
                value={a.permission}
                onChange={(e) => handleUpdatePermission(a.userId, e.target.value as "view" | "edit")}
                disabled={pending}
                style={selectStyle}
              >
                <option value="view">View Only</option>
                <option value="edit">Editorial</option>
              </select>
              <button
                type="button"
                onClick={() => handleRevoke(a.userId, a.username)}
                disabled={pending}
                style={{ ...btnStyle, color: "#d4848e", borderColor: "var(--color-crimson-dim)" }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1.25rem" }}>
          Not shared with anyone yet.
        </p>
      )}

      {/* Add user */}
      {grantable.length > 0 ? (
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.6rem" }}>
            Add a user
          </p>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              disabled={pending}
              style={{ ...selectStyle, minWidth: "140px" }}
            >
              <option value="">Select user…</option>
              {grantable.map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
            <select
              value={addPermission}
              onChange={(e) => setAddPermission(e.target.value as "view" | "edit")}
              disabled={pending}
              style={selectStyle}
            >
              <option value="view">View Only</option>
              <option value="edit">Editorial</option>
            </select>
            <button
              type="button"
              onClick={handleShare}
              disabled={pending || !addUserId}
              style={{
                ...btnStyle,
                color: addUserId ? "var(--color-gold)" : "var(--color-ink-faint)",
                borderColor: addUserId ? "var(--color-gold-dim)" : "var(--color-border)",
                opacity: !addUserId ? 0.5 : 1,
              }}
            >
              Share
            </button>
          </div>
        </div>
      ) : (
        accesses.length === 0 && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
            No other users to add.
          </p>
        )
      )}

      {error && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", marginTop: "0.75rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
