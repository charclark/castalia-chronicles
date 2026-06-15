"use client";

import { useActionState, useState, useTransition, useRef } from "react";
import { updateAboutContent, updateAboutPhoto, removeAboutPhoto } from "@/app/actions/site";

// ── Compression (same settings as ImageUploader) ──────────────────────────────
const MAX_PX = 1200;
const JPEG_QUALITY = 0.82;

async function compressToJpeg(file: File): Promise<{ blob: Blob; width: number; height: number }> {
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
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => { if (blob) resolve({ blob, width: w, height: h }); else reject(new Error("toBlob failed")); },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.75rem",
};
const fieldLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-ink-muted)",
};
const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.6rem 0.8rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  outline: "none",
  width: "100%",
};
const successStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#8bc98d",
};
const errorStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function AboutEditor({
  initialEyebrow,
  initialHeadline,
  initialBio,
  hasPhoto,
}: {
  initialEyebrow: string | null;
  initialHeadline: string | null;
  initialBio: string | null;
  hasPhoto: boolean;
}) {
  // ── Content state ───────────────────────────────────────────────────────────
  const [contentState, contentAction, contentPending] = useActionState(updateAboutContent, null);

  // ── Photo state ─────────────────────────────────────────────────────────────
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
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file.");
      return;
    }
    setPhotoError("");
    setPhotoSuccess("");
    setCompressing(true);
    setOrigSize(file.size);
    try {
      const { blob } = await compressToJpeg(file);
      setCompressedBlob(blob);
      setCompSize(blob.size);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setPhotoError("Could not process image. Try a different file.");
    } finally {
      setCompressing(false);
    }
  }

  function handlePhotoSave() {
    if (!compressedBlob) return;
    setPhotoError("");
    setPhotoSuccess("");
    startPhotoSave(async () => {
      const fd = new FormData();
      fd.append("photo", new File([compressedBlob], "photo.jpg", { type: "image/jpeg" }));
      const result = await updateAboutPhoto(null, fd);
      if (result.error) {
        setPhotoError(result.error);
      } else {
        setPhotoSuccess("Photo saved.");
        setCurrentHasPhoto(true);
        setCompressedBlob(null);
      }
    });
  }

  function handleRemovePhoto() {
    if (!window.confirm("Remove the page photo? The About page will show a placeholder.")) return;
    startRemove(async () => {
      const result = await removeAboutPhoto();
      if (!result.error) {
        setCurrentHasPhoto(false);
        setPreview(null);
        setCompressedBlob(null);
        setPhotoSuccess("Photo removed.");
      } else {
        setPhotoError(result.error);
      }
    });
  }

  return (
    <div style={{ maxWidth: "700px" }}>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.3rem",
        }}
      >
        The Lore Editor
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginBottom: "2.5rem",
        }}
      >
        Controls the content of the public About page. Changes appear immediately once saved.
      </p>

      {/* ── Page Content ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={sectionLabel}>Page Content</p>

        <form action={contentAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label htmlFor="eyebrow" style={fieldLabel}>Eyebrow Text</label>
            <input
              id="eyebrow"
              name="eyebrow"
              type="text"
              defaultValue={initialEyebrow ?? ""}
              placeholder="e.g. ABOUT THE AUTHOR"
              style={inputStyle}
            />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              Small uppercase label shown above the headline. Defaults to "ABOUT WRITEWRIGHT" if empty.
            </p>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label htmlFor="headline" style={fieldLabel}>Headline</label>
            <input
              id="headline"
              name="headline"
              type="text"
              defaultValue={initialHeadline ?? ""}
              placeholder="e.g. Alexandra Castalia"
              style={inputStyle}
            />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              Large heading below the eyebrow. Defaults to "Welcome to WriteWright" if empty.
            </p>
          </div>

          {/* Body Text */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label htmlFor="bio" style={fieldLabel}>Body Text</label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={initialBio ?? ""}
              rows={12}
              placeholder="Write the page content here. Separate paragraphs with a blank line."
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "3px",
                padding: "0.75rem 1rem",
                color: "var(--color-ink)",
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                lineHeight: 1.75,
                outline: "none",
                width: "100%",
                resize: "vertical",
              }}
            />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              Separate paragraphs with a blank line. Plain text only.
            </p>
          </div>

          {contentState?.error && <p style={errorStyle}>{contentState.error}</p>}
          {contentState?.success && <p style={successStyle}>{contentState.success}</p>}

          <div>
            <button
              type="submit"
              disabled={contentPending}
              style={{
                background: contentPending ? "var(--color-border)" : "var(--color-crimson)",
                border: "none",
                borderRadius: "3px",
                padding: "0.65rem 1.4rem",
                color: "var(--color-ink)",
                fontFamily: "var(--font-heading)",
                fontSize: "1rem",
                letterSpacing: "0.06em",
                cursor: contentPending ? "default" : "pointer",
              }}
            >
              {contentPending ? "Saving…" : "Save Content"}
            </button>
          </div>
        </form>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2.5rem" }} />

      {/* ── Page Photo ──────────────────────────────────────────────────────── */}
      <div>
        <p style={sectionLabel}>Page Photo</p>

        {/* Current photo preview */}
        {currentHasPhoto && !preview && (
          <div style={{ marginBottom: "1.25rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/site/photo?${Date.now()}`}
              alt="Current page photo"
              style={{
                maxWidth: "200px",
                display: "block",
                borderRadius: "3px",
                border: "1px solid var(--color-border)",
                marginBottom: "0.6rem",
              }}
            />
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={removePending}
              style={{
                background: "transparent",
                border: "1px solid var(--color-crimson-dim)",
                borderRadius: "3px",
                padding: "0.3rem 0.85rem",
                color: "#d4848e",
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                cursor: removePending ? "default" : "pointer",
                opacity: removePending ? 0.6 : 1,
              }}
            >
              {removePending ? "Removing…" : "Remove photo"}
            </button>
          </div>
        )}

        {/* File picker */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed var(--color-border-light)",
            borderRadius: "4px",
            padding: preview ? "0" : "2.5rem 1.5rem",
            textAlign: "center",
            cursor: "pointer",
            overflow: "hidden",
            minHeight: preview ? "0" : "130px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "0.75rem",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold-dim)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-light)")}
        >
          {compressing ? (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              Compressing…
            </p>
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="New photo preview" style={{ maxWidth: "100%", maxHeight: "320px", display: "block", borderRadius: "2px" }} />
          ) : (
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-ink-muted)", marginBottom: "0.3rem" }}>
                {currentHasPhoto ? "Click to replace photo" : "Click to upload a photo"}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-ink-faint)" }}>
                JPEG, PNG, WebP — compressed automatically
              </p>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

        {compressedBlob && !compressing && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#8bc98d", marginBottom: "0.75rem" }}>
            Ready to save — compressed to {fmtBytes(compSize)} (from {fmtBytes(origSize)})
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ background: "none", border: "none", color: "#8bc98d", cursor: "pointer", textDecoration: "underline", fontSize: "0.8rem", marginLeft: "0.75rem" }}
            >
              Change
            </button>
          </p>
        )}

        {photoError && <p style={{ ...errorStyle, marginBottom: "0.75rem" }}>{photoError}</p>}
        {photoSuccess && <p style={{ ...successStyle, marginBottom: "0.75rem" }}>{photoSuccess}</p>}

        <button
          type="button"
          onClick={handlePhotoSave}
          disabled={!compressedBlob || photoSaving || compressing}
          style={{
            background: (!compressedBlob || photoSaving || compressing) ? "var(--color-border)" : "var(--color-crimson)",
            border: "none",
            borderRadius: "3px",
            padding: "0.65rem 1.4rem",
            color: "var(--color-ink)",
            fontFamily: "var(--font-heading)",
            fontSize: "1rem",
            letterSpacing: "0.06em",
            cursor: (!compressedBlob || photoSaving || compressing) ? "default" : "pointer",
          }}
        >
          {photoSaving ? "Saving…" : compressing ? "Compressing…" : "Save Photo"}
        </button>
      </div>
    </div>
  );
}
