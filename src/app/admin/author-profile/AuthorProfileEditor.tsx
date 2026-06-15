"use client";

import { useActionState, useState, useTransition, useRef } from "react";
import { saveAuthorProfile, saveAuthorPhoto, removeAuthorPhoto } from "@/app/actions/author-profiles";

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
}: {
  userId: string;
  initialEyebrow: string | null;
  initialHeadline: string | null;
  initialBodyText: string | null;
  hasPhoto: boolean;
  status: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
}) {
  const [profileState, profileAction, profilePending] = useActionState(saveAuthorProfile, null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [origSize, setOrigSize] = useState(0);
  const [compSize, setCompSize] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");
  const [photoSaving, startPhotoSave] = useTransition();
  const [removePending, startRemove] = useTransition();
  const [currentHasPhoto, setCurrentHasPhoto] = useState(hasPhoto);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Please select an image file."); return; }
    setPhotoError(""); setPhotoSuccess(""); setCompressing(true); setOrigSize(file.size);
    try {
      const { blob } = await compressToJpeg(file);
      setCompressedBlob(blob); setCompSize(blob.size);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(blob));
    } catch { setPhotoError("Could not process image. Try a different file."); }
    finally { setCompressing(false); }
  }

  function handlePhotoSave() {
    if (!compressedBlob) return;
    setPhotoError(""); setPhotoSuccess("");
    startPhotoSave(async () => {
      const fd = new FormData();
      fd.append("photo", new File([compressedBlob], "photo.jpg", { type: "image/jpeg" }));
      const result = await saveAuthorPhoto(null, fd);
      if (result.error) { setPhotoError(result.error); }
      else { setPhotoSuccess("Photo saved."); setCurrentHasPhoto(true); setCompressedBlob(null); }
    });
  }

  function handleRemovePhoto() {
    if (!window.confirm("Remove your author photo?")) return;
    startRemove(async () => {
      const result = await removeAuthorPhoto();
      if (!result.error) { setCurrentHasPhoto(false); setPreview(null); setCompressedBlob(null); setPhotoSuccess("Photo removed."); }
      else { setPhotoError(result.error); }
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
        Fill in your profile and submit for approval. Approved profiles appear on the public Our Authors page.
      </p>
      {submittedDate && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)", marginBottom: "2rem" }}>
          {status === "approved" && approvedDate
            ? `Approved on ${approvedDate}`
            : `Last submitted ${submittedDate}`}
        </p>
      )}
      {!submittedDate && <div style={{ marginBottom: "2rem" }} />}

      {/* ── Profile text fields ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={sectionLabel}>Profile Content</p>
        <form action={profileAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label htmlFor="eyebrowText" style={fieldLabel}>Eyebrow Text</label>
            <input id="eyebrowText" name="eyebrowText" type="text" defaultValue={initialEyebrow ?? ""} placeholder="About Our Author" style={inputStyle} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              Small label above your name on the public page. Defaults to "About Our Author".
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

          {profileState?.error && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e" }}>{profileState.error}</p>
          )}
          {profileState?.success && (
            <div style={{ background: "rgba(76,139,64,0.12)", border: "1px solid rgba(76,139,64,0.35)", borderRadius: "3px", padding: "0.7rem 1rem", color: "#8bc98d", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
              {profileState.success}
            </div>
          )}

          <div>
            <button type="submit" disabled={profilePending} style={{
              background: profilePending ? "var(--color-border)" : "var(--color-crimson)",
              border: "none", borderRadius: "3px", padding: "0.65rem 1.4rem",
              color: "var(--color-ink)", fontFamily: "var(--font-heading)", fontSize: "1rem",
              letterSpacing: "0.06em", cursor: profilePending ? "default" : "pointer",
            }}>
              {profilePending ? "Submitting…" : "Save & Submit for Approval"}
            </button>
          </div>
        </form>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2.5rem" }} />

      {/* ── Photo ───────────────────────────────────────────────────────────── */}
      <div>
        <p style={sectionLabel}>Author Photo</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1rem" }}>
          Photo is saved independently — no resubmission needed for photo changes.
        </p>

        {currentHasPhoto && !preview && (
          <div style={{ marginBottom: "1.25rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/author-photo/${userId}?${Date.now()}`}
              alt="Current author photo"
              style={{ maxWidth: "200px", display: "block", borderRadius: "3px", border: "1px solid var(--color-border)", marginBottom: "0.6rem" }}
            />
            <button type="button" onClick={handleRemovePhoto} disabled={removePending} style={{
              background: "transparent", border: "1px solid var(--color-crimson-dim)", borderRadius: "3px",
              padding: "0.3rem 0.85rem", color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.82rem",
              cursor: removePending ? "default" : "pointer", opacity: removePending ? 0.6 : 1,
            }}>
              {removePending ? "Removing…" : "Remove photo"}
            </button>
          </div>
        )}

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed var(--color-border-light)", borderRadius: "4px",
            padding: preview ? "0" : "2.5rem 1.5rem", textAlign: "center", cursor: "pointer",
            overflow: "hidden", minHeight: preview ? "0" : "130px",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "0.75rem", transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold-dim)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-light)")}
        >
          {compressing ? (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic" }}>Compressing…</p>
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="New photo preview" style={{ maxWidth: "100%", maxHeight: "320px", display: "block", borderRadius: "2px" }} />
          ) : (
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-ink-muted)", marginBottom: "0.3rem" }}>
                {currentHasPhoto ? "Click to replace photo" : "Click to upload a photo"}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-ink-faint)" }}>JPEG, PNG, WebP — compressed automatically</p>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

        {compressedBlob && !compressing && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#8bc98d", marginBottom: "0.75rem" }}>
            Ready — {fmtBytes(compSize)} (from {fmtBytes(origSize)})
            <button type="button" onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", color: "#8bc98d", cursor: "pointer", textDecoration: "underline", fontSize: "0.8rem", marginLeft: "0.75rem" }}>Change</button>
          </p>
        )}

        {photoError && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", marginBottom: "0.75rem" }}>{photoError}</p>}
        {photoSuccess && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#8bc98d", marginBottom: "0.75rem" }}>{photoSuccess}</p>}

        <button type="button" onClick={handlePhotoSave} disabled={!compressedBlob || photoSaving || compressing} style={{
          background: (!compressedBlob || photoSaving || compressing) ? "var(--color-border)" : "var(--color-crimson)",
          border: "none", borderRadius: "3px", padding: "0.65rem 1.4rem",
          color: "var(--color-ink)", fontFamily: "var(--font-heading)", fontSize: "1rem",
          letterSpacing: "0.06em", cursor: (!compressedBlob || photoSaving || compressing) ? "default" : "pointer",
        }}>
          {photoSaving ? "Saving…" : compressing ? "Compressing…" : "Save Photo"}
        </button>
      </div>
    </div>
  );
}
