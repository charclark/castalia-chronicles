"use client";

import { useState, useTransition } from "react";
import {
  setUniversePrivacy,
  grantUniverseAccess,
  updateUniverseAccess,
  revokeUniverseAccess,
} from "@/app/actions/universe-access";

type AccessEntry = {
  userId: string;
  username: string;
  permission: "view" | "edit";
};

type OtherUser = { id: string; username: string };

const btnSm: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.25rem 0.6rem",
  color: "var(--color-ink-muted)",
  fontFamily: "var(--font-body)",
  fontSize: "0.8rem",
  cursor: "pointer",
};

export default function UniverseAccessPanel({
  universeId,
  isPrivate: initialPrivate,
  accesses: initialAccesses,
  otherUsers,
}: {
  universeId: string;
  isPrivate: boolean;
  accesses: AccessEntry[];
  otherUsers: OtherUser[];
}) {
  const [isPrivate, setIsPrivate] = useState(initialPrivate);
  const [accesses, setAccesses] = useState(initialAccesses);
  const [addUserId, setAddUserId] = useState("");
  const [addPermission, setAddPermission] = useState<"view" | "edit">("view");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const selectStyle: React.CSSProperties = {
    background: "var(--color-bg-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "3px",
    padding: "0.25rem 0.45rem",
    color: "var(--color-ink)",
    fontFamily: "var(--font-body)",
    fontSize: "0.85rem",
    cursor: "pointer",
    outline: "none",
  };

  async function handlePrivacyToggle(toPrivate: boolean) {
    setError("");
    start(async () => {
      const r = await setUniversePrivacy(universeId, toPrivate);
      if (r.error) setError(r.error);
      else setIsPrivate(toPrivate);
    });
  }

  async function handleGrant() {
    if (!addUserId) return;
    setError("");
    start(async () => {
      const r = await grantUniverseAccess(universeId, addUserId, addPermission);
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

  async function handleUpdate(userId: string, permission: "view" | "edit") {
    setError("");
    start(async () => {
      const r = await updateUniverseAccess(universeId, userId, permission);
      if (r.error) setError(r.error);
      else setAccesses((prev) => prev.map((a) => a.userId === userId ? { ...a, permission } : a));
    });
  }

  async function handleRevoke(userId: string) {
    if (!window.confirm("Remove this user's access?")) return;
    setError("");
    start(async () => {
      const r = await revokeUniverseAccess(universeId, userId);
      if (r.error) setError(r.error);
      else setAccesses((prev) => prev.filter((a) => a.userId !== userId));
    });
  }

  const grantableUsers = otherUsers.filter((u) => !accesses.some((a) => a.userId === u.id));

  return (
    <div
      style={{
        marginTop: "1rem",
        borderTop: "1px solid var(--color-border)",
        paddingTop: "1rem",
        opacity: pending ? 0.7 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {/* Privacy toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-ink-muted)",
          }}
        >
          Visibility
        </span>
        <button
          type="button"
          onClick={() => handlePrivacyToggle(true)}
          disabled={pending}
          style={{
            ...btnSm,
            color: isPrivate ? "var(--color-ink)" : "var(--color-ink-faint)",
            borderColor: isPrivate ? "var(--color-gold-dim)" : "var(--color-border)",
            background: isPrivate ? "rgba(201,168,76,0.08)" : "transparent",
          }}
        >
          Private
        </button>
        <button
          type="button"
          onClick={() => handlePrivacyToggle(false)}
          disabled={pending}
          style={{
            ...btnSm,
            color: !isPrivate ? "var(--color-ink)" : "var(--color-ink-faint)",
            borderColor: !isPrivate ? "var(--color-gold-dim)" : "var(--color-border)",
            background: !isPrivate ? "rgba(201,168,76,0.08)" : "transparent",
          }}
        >
          Shared
        </button>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            color: "var(--color-ink-faint)",
            fontStyle: "italic",
          }}
        >
          {isPrivate ? "Only you can see this universe." : "Specific users you choose can access it."}
        </span>
      </div>

      {/* Access list (only shown when shared) */}
      {!isPrivate && (
        <>
          {accesses.length > 0 && (
            <div style={{ marginBottom: "0.75rem" }}>
              {accesses.map((a) => (
                <div
                  key={a.userId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.45rem 0",
                    borderBottom: "1px solid var(--color-border)",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--color-ink)", flex: 1, minWidth: "80px" }}>
                    {a.username}
                  </span>
                  <select
                    value={a.permission}
                    onChange={(e) => handleUpdate(a.userId, e.target.value as "view" | "edit")}
                    disabled={pending}
                    style={selectStyle}
                  >
                    <option value="view">View Only</option>
                    <option value="edit">Edit</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRevoke(a.userId)}
                    disabled={pending}
                    style={{ ...btnSm, color: "#d4848e", borderColor: "var(--color-crimson-dim)" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add user */}
          {grantableUsers.length > 0 ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                disabled={pending}
                style={{ ...selectStyle, minWidth: "120px" }}
              >
                <option value="">Add user…</option>
                {grantableUsers.map((u) => (
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
                <option value="edit">Edit</option>
              </select>
              <button
                type="button"
                onClick={handleGrant}
                disabled={pending || !addUserId}
                style={{
                  ...btnSm,
                  color: "var(--color-gold)",
                  borderColor: "var(--color-gold-dim)",
                  opacity: !addUserId ? 0.5 : 1,
                }}
              >
                Add
              </button>
            </div>
          ) : (
            accesses.length === 0 && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
                No other users to add.
              </p>
            )
          )}
        </>
      )}

      {error && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
