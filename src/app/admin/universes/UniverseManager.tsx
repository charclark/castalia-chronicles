"use client";

import { useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createUniverse,
  renameUniverse,
  deleteUniverse,
  switchUniverse,
} from "@/app/actions/universe";
import UniverseAccessPanel from "./UniverseAccessPanel";
import DestroyUniverseConfirm from "@/components/DestroyUniverseConfirm";

type AccessEntry = { userId: string; username: string; permission: "view" | "edit" };
type OtherUser = { id: string; username: string };

type Universe = {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  createdByUserId: string | null;
  createdAt: Date;
  accesses?: { userId: string; permission: string; user: { id: string; username: string } }[];
};

const card: React.CSSProperties = {
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  padding: "1.5rem",
};

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.6rem 0.85rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  outline: "none",
  width: "100%",
};

const btnPrimary: React.CSSProperties = {
  background: "var(--color-crimson)",
  border: "none",
  borderRadius: "3px",
  padding: "0.55rem 1.1rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-heading)",
  fontSize: "1rem",
  letterSpacing: "0.06em",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.45rem 0.9rem",
  color: "var(--color-ink-muted)",
  fontFamily: "var(--font-body)",
  fontSize: "0.88rem",
  cursor: "pointer",
};

// ── Create form ──────────────────────────────────────────────────────────────

function CreateUniverseForm() {
  const [state, action, pending] = useActionState(createUniverse, null);

  return (
    <div style={{ ...card, marginBottom: "2rem" }}>
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.25rem",
          fontWeight: 400,
          color: "var(--color-gold)",
          marginBottom: "1.25rem",
          letterSpacing: "0.04em",
        }}
      >
        Create a New Universe
      </h3>

      {state?.error && (
        <div
          role="alert"
          style={{
            background: "rgba(139,38,53,0.15)",
            border: "1px solid var(--color-crimson-dim)",
            borderRadius: "3px",
            padding: "0.65rem 1rem",
            color: "#d4848e",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            marginBottom: "1rem",
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
            padding: "0.65rem 1rem",
            color: "#8bc98d",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            marginBottom: "1rem",
          }}
        >
          {state.success}
        </div>
      )}

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label
            htmlFor="new-name"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-ink-muted)",
            }}
          >
            Name *
          </label>
          <input
            id="new-name"
            name="name"
            type="text"
            placeholder="e.g. The Thornwood Chronicles"
            required
            maxLength={100}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label
            htmlFor="new-description"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-ink-muted)",
            }}
          >
            Description (optional)
          </label>
          <textarea
            id="new-description"
            name="description"
            rows={2}
            placeholder="A brief note about this universe…"
            style={{
              ...inputStyle,
              resize: "vertical",
              lineHeight: "1.6",
            }}
          />
        </div>

        <div>
          <button type="submit" disabled={pending} style={btnPrimary}>
            {pending ? "Creating…" : "Create Universe"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Universe card ────────────────────────────────────────────────────────────

function UniverseCard({
  universe,
  isActive,
  onActivate,
  isSuperAdmin,
  currentUserId,
  otherUsers,
}: {
  universe: Universe;
  isActive: boolean;
  onActivate: (id: string) => void;
  isSuperAdmin: boolean;
  currentUserId: string;
  otherUsers: OtherUser[];
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(universe.name);
  const [showDestroyConfirm, setShowDestroyConfirm] = useState(false);
  const [renameState, renameAction, renamePending] = useActionState(
    renameUniverse,
    null
  );
  const [deletePending, startDelete] = useTransition();

  const isOwner = universe.createdByUserId === currentUserId;
  const canDelete = isSuperAdmin || isOwner;

  function handleDeleteConfirmed() {
    setShowDestroyConfirm(false);
    startDelete(async () => {
      await deleteUniverse(universe.id);
    });
  }

  function handleRenameSubmit(e: React.FormEvent) {
    if (!editName.trim() || editName.trim() === universe.name) {
      e.preventDefault();
      setEditing(false);
      return;
    }
  }

  return (
    <div
      style={{
        ...card,
        borderColor: isActive ? "var(--color-gold)" : "var(--color-border)",
        opacity: deletePending ? 0.5 : 1,
        transition: "opacity 0.2s, border-color 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* Name / edit */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          {editing ? (
            <form
              action={renameAction}
              onSubmit={handleRenameSubmit}
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <input type="hidden" name="id" value={universe.id} />
              <input
                name="name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                maxLength={100}
                autoFocus
                style={{ ...inputStyle, width: "auto", flex: 1 }}
              />
              <button
                type="submit"
                disabled={renamePending}
                style={{ ...btnPrimary, padding: "0.45rem 0.9rem", fontSize: "0.88rem" }}
              >
                {renamePending ? "…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditName(universe.name);
                }}
                style={btnGhost}
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.4rem",
                  fontWeight: 400,
                  color: isActive ? "var(--color-gold)" : "var(--color-ink)",
                  marginBottom: universe.description ? "0.3rem" : 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                {universe.name}
                {isActive && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--color-gold)",
                      border: "1px solid var(--color-gold)",
                      borderRadius: "2px",
                      padding: "0.15rem 0.45rem",
                      verticalAlign: "middle",
                    }}
                  >
                    Active
                  </span>
                )}
              </h3>
              {universe.description && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    color: "var(--color-ink-muted)",
                    lineHeight: 1.55,
                  }}
                >
                  {universe.description}
                </p>
              )}
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.78rem",
                  color: "var(--color-ink-faint)",
                  marginTop: "0.5rem",
                }}
              >
                Created{" "}
                {universe.createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </>
          )}

          {renameState?.error && !editing && (
            <p style={{ color: "#d4848e", fontSize: "0.85rem", marginTop: "0.4rem" }}>
              {renameState.error}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {!editing && (
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
            {!isActive && (
              <button
                type="button"
                onClick={() => onActivate(universe.id)}
                style={{
                  ...btnGhost,
                  color: "var(--color-gold)",
                  borderColor: "var(--color-gold-dim)",
                }}
              >
                Set Active
              </button>
            )}
            {isSuperAdmin && (
              <button type="button" onClick={() => setEditing(true)} style={btnGhost}>
                Rename
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDestroyConfirm(true)}
                disabled={deletePending}
                style={{
                  ...btnGhost,
                  color: "#d4848e",
                  borderColor: "var(--color-crimson-dim)",
                }}
              >
                {deletePending ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Universe access panel — only visible to super-admin */}
      {isSuperAdmin && (
        <UniverseAccessPanel
          universeId={universe.id}
          isPrivate={universe.isPrivate}
          accesses={(universe.accesses ?? []).map((a) => ({
            userId: a.userId,
            username: a.user.username,
            permission: a.permission as "view" | "edit",
          }))}
          otherUsers={otherUsers}
        />
      )}

      {/* Two-step destroy confirmation */}
      {showDestroyConfirm && (
        <DestroyUniverseConfirm
          universeName={universe.name}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowDestroyConfirm(false)}
        />
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function UniverseManager({
  universes: initialUniverses,
  selectedId,
  isSuperAdmin,
  currentUserId,
  otherUsers,
}: {
  universes: Universe[];
  selectedId: string | null;
  isSuperAdmin: boolean;
  currentUserId: string;
  otherUsers: OtherUser[];
}) {
  const router = useRouter();
  const [switching, startSwitch] = useTransition();

  const activeId =
    selectedId && initialUniverses.some((u) => u.id === selectedId)
      ? selectedId
      : (initialUniverses[0]?.id ?? null);

  function handleActivate(id: string) {
    startSwitch(async () => {
      await switchUniverse(id);
      router.refresh();
    });
  }

  return (
    <div>
      {isSuperAdmin && <CreateUniverseForm />}

      {initialUniverses.length === 0 ? (
        <div
          style={{
            ...card,
            textAlign: "center",
            padding: "3rem 2rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-ink-faint)",
              fontStyle: "italic",
              fontSize: "1.05rem",
            }}
          >
            No universes yet. Create your first one above.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {switching && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                color: "var(--color-ink-faint)",
                fontStyle: "italic",
              }}
            >
              Switching universe…
            </p>
          )}
          {initialUniverses.map((u) => (
            <UniverseCard
              key={u.id}
              universe={u}
              isActive={u.id === activeId}
              onActivate={handleActivate}
              isSuperAdmin={isSuperAdmin}
              currentUserId={currentUserId}
              otherUsers={otherUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
