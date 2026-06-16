"use client";

import { useActionState, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveAuthorProfile, removeAuthorPhoto, deleteAuthorProfile } from "@/app/actions/author-profiles";

const MAX_PX = 1200;
const JPEG_QUALITY = 0.82;

async function compressToJpeg(file: File): Promise<{ blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, MAX_PX / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => { if (blob) resolve({ blob }); else reject(new Error("toBlob failed")); },
        "image/jpeg", JPEG_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

function fmtBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.75rem",
};
const fieldLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-ink-muted)",
};
const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
  borderRadius: "3px", padding: "0.6rem 0.8rem", color: "var(--color-ink)",
  fontFamily: "var(--font-body)", fontSize: "0.95rem", outline: "none", width: "100%",
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const map: Record<string, { label: string; color: string; border: string; bg: string }> = {
    pending:  { label: "Pending Review", color: "var(--color-gold)",    border: "var(--color-gold-dim)",    bg: "rgba(201,168,76,0.08)" },
    approved: { label: "Approved",       color: "#8bc98d",              border: "rgba(76,139,64,0.35)",     bg: "rgba(76,139,64,0.08)" },
    rejected: { label: "Rejected",       color: "#d4848e",              border: "var(--color-crimson-dim)", bg: "rgba(139,38,53,0.08)" },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span style={{
      fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
      textTransform: "uppercase", color: s.color,
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: "3px", padding: "0.2rem 0.65rem",
    }}>
      {s.label}
    </span>
  );
}

export default function AuthorProfileEditor({
  userId,
  initialEyebrow,
  initialHeadline,
  initialBodyText,
  hasPhoto,
  status,
  submittedAt,
  approvedAt,
  rejectionNote,
}: {
  userId: string;
  initialEyebrow: string | null;
  initialHeadline: string | null;
  initialBodyText: string | null;
  hasPhoto: boolean;
  status: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectionNote: string | null;
}) {
  const router = useRouter();
  const [profileState, profileAction, profilePending] = useActionState(saveAuthorProfile, null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [origSize, setOrigSize] = useState(0);
  const [compSize, setCompSize] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const [currentHasPhoto, setCurrentHasPhoto] = useState(hasPhoto);
  const [removePending, startRemove] = useTransition();
  const [removePhotoMsg, setRemovePhotoMsg] = useState("");

  const [deletePending, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Please select an image file."); return; }
    setPhotoError(""); setCompressing(true); setOrigSize(file.size);
    try {
      const { blob } = await compressToJpeg(file);
      setCompressedBlob(blob); setCompSize(blob.size);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(blob));
    } catch { setPhotoError("Could not process image. Try a different file."); }
    finally { setCompressing(false); }
  }

  function handleFormAction(formData: FormData) {
    if (compressedBlob) {
      formData.set("photo", new File([compressedBlob], "photo.jpg", { type: "image/jpeg" }));
    }
    return profileAction(formData);
  }

  function handleRemovePhoto() {
    if (!window.confirm("Delete your author photo? This takes effect immediately without re-approval.")) return;
    setRemovePhotoMsg(""); setPhotoError("");
    startRemove(async () => {
      const result = await removeAuthorPhoto();
      if (result.error) { setPhotoError(result.error); }
      else {
        setCurrentHasPhoto(false);
        setPreview(null);
        setCompressedBlob(null);
        if (fileRef.current) fileRef.current.value = "";
        setRemovePhotoMsg("Photo deleted.");
      }
    });
  }

  function handleDeleteProfile() {
    if (!window.confirm("Are you sure? This will remove your author profile from WriteWright.")) return;
    startDelete(async () => {
      const result = await deleteAuthorProfile();
      if (result?.error) { setDeleteError(result.error); }
      else { router.refresh(); }
    });
  }

  const submittedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const approvedDate = approvedAt
    ? new Date(approvedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 400, color: "var(--color-ink)" }}>
          My Author Profile
        </h2>
        {status && <StatusBadge status={status} />}
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "0.5rem" }}>
        Fill in your profile and submit for approval. Approved profiles appear on the public Our Authors page. Any change — including a new photo — requires Char&apos;s re-approval before it goes live.
      </p>
      {submittedDate && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)", marginBottom: rejectionNote && status === "rejected" ? "0.6rem" : "2rem" }}>
          {status === "approved" && approvedDate
            ? `Approved on ${approvedDate}`
            : `Last submitted ${submittedDate}`}
        </p>
      )}
      {rejectionNote && status === "rejected" && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontStyle: "italic", color: "#d4848e", marginBottom: "2rem" }}>
          Feedback from WriteWright: {rejectionNote}
        </p>
      )}
      {!submittedDate && <div style={{ marginBottom: "2rem" }} />}

      <form action={handleFormAction} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* ── Text fields ─────────────────────────────────────────────────── */}
        <div>
          <p style={sectionLabel}>Profile Content</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label htmlFor="eyebrowText" style={fieldLabel}>Eyebrow Text</label>
              <input id="eyebrowText" name="eyebrowText" type="text" defaultValue={initialEyebrow ?? ""} placeholder="About Our Author" style={inputStyle} />
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
                Small label above your name on the public page.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label htmlFor="headline" style={fieldLabel}>Headline (Your Name)</label>
              <input id="headline" name="headline" type="text" defaultValue={initialHeadline ?? ""} placeholder="Author Name" style={inputStyle} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label htmlFor="bodyText" style={fieldLabel}>Body Text</label>
              <textarea
                id="bodyText" name="bodyText" defaultValue={initialBodyText ?? ""} rows={10}
                placeholder="Tell us about yourself"
                style={{ ...inputStyle, lineHeight: 1.75, resize: "vertical" }}
              />
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
                Separate paragraphs with a blank line. Plain text only.
              </p>
            </div>
          </div>
        </div>

        {/* ── Photo ───────────────────────────────────────────────────────── */}
        <div>
          <p style={sectionLabel}>Author Photo</p>

          {currentHasPhoto && !preview && (
            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/author-photo/${userId}?t=${Date.now()}`}
                alt="Current author photo"
                style={{ maxWidth: "160px", display: "block", borderRadius: "3px", border: "1px solid var(--color-border)" }}
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={removePending}
                style={{
                  background: "transparent", border: "1px solid var(--color-crimson-dim)", borderRadius: "3px",
                  padding: "0.35rem 0.9rem", color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.82rem",
                  cursor: removePending ? "default" : "pointer", opacity: removePending ? 0.6 : 1,
                }}
              >
                {removePending ? "Deleting…" : "Delete Photo"}
              </button>
            </div>
          )}
          {removePhotoMsg && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#8bc98d", marginBottom: "0.75rem" }}>{removePhotoMsg}</p>
          )}

          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed var(--color-border-light)", borderRadius: "4px",
              padding: preview ? "0" : "2rem 1.5rem", textAlign: "center", cursor: "pointer",
              overflow: "hidden", minHeight: preview ? "0" : "110px",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "0.5rem",
            }}
          >
            {compressing ? (
              <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic" }}>Compressing…</p>
            ) : preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="New photo preview" style={{ maxWidth: "100%", maxHeight: "280px", display: "block", borderRadius: "2px" }} />
            ) : (
              <div>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink-muted)", marginBottom: "0.25rem" }}>
                  {currentHasPhoto ? "Click to replace photo" : "Click to upload a photo"}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)" }}>JPEG, PNG, WebP — compressed automatically</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

          {compressedBlob && !compressing && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#8bc98d", marginBottom: "0.25rem" }}>
              Photo ready — {fmtBytes(compSize)} (from {fmtBytes(origSize)})
              <button
                type="button"
                onClick={() => { setPreview(null); setCompressedBlob(null); if (fileRef.current) fileRef.current.value = ""; }}
                style={{ background: "none", border: "none", color: "var(--color-ink-faint)", cursor: "pointer", fontSize: "0.78rem", marginLeft: "0.75rem", textDecoration: "underline" }}
              >
                Remove
              </button>
            </p>
          )}
          {photoError && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#d4848e" }}>{photoError}</p>}
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginTop: "0.4rem" }}>
            Uploading a new photo submits with your profile and requires re-approval before going live.
          </p>
        </div>

        {/* ── Feedback + Submit ────────────────────────────────────────────── */}
        {profileState?.error && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e" }}>{profileState.error}</p>
        )}
        {profileState?.success && (
          <div style={{ background: "rgba(76,139,64,0.12)", border: "1px solid rgba(76,139,64,0.35)", borderRadius: "3px", padding: "0.7rem 1rem", color: "#8bc98d", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
            {profileState.success}
          </div>
        )}

        <div>
          <button type="submit" disabled={profilePending || compressing} style={{
            background: (profilePending || compressing) ? "var(--color-border)" : "var(--color-crimson)",
            border: "none", borderRadius: "3px", padding: "0.65rem 1.4rem",
            color: "var(--color-ink)", fontFamily: "var(--font-heading)", fontSize: "1rem",
            letterSpacing: "0.06em", cursor: (profilePending || compressing) ? "default" : "pointer",
          }}>
            {profilePending ? "Submitting…" : compressing ? "Processing photo…" : "Save & Submit for Approval"}
          </button>
        </div>
      </form>

      {/* ── Delete profile ───────────────────────────────────────────────── */}
      <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-border)" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", marginBottom: "1rem" }}>
          Deleting your profile removes it immediately from WriteWright, including from the public Our Authors page.
        </p>
        {deleteError && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#d4848e", marginBottom: "0.75rem" }}>{deleteError}</p>
        )}
        <button
          type="button"
          onClick={handleDeleteProfile}
          disabled={deletePending}
          style={{
            background: "transparent",
            border: "1px solid var(--color-crimson-dim)",
            borderRadius: "3px", padding: "0.45rem 1rem",
            color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.85rem",
            cursor: deletePending ? "default" : "pointer", opacity: deletePending ? 0.6 : 1,
          }}
        >
          {deletePending ? "Deleting…" : "Delete My Profile"}
        </button>
      </div>
    </div>
  );
}
