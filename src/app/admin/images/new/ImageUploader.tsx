"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/app/actions/images";

// ── Compression settings ─────────────────────────────────────────────────────
// Images are resized to at most MAX_PX on the long edge and JPEG-compressed.
// Originals over ~3–5 MB typically compress to under 300 KB this way.
const MAX_PX = 1200;
const JPEG_QUALITY = 0.82;

const CATEGORIES = [
  "book cover",
  "character art",
  "sketch",
  "map",
  "reference",
  "other",
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function compressToJpeg(
  file: File
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { naturalWidth: w, naturalHeight: h } = img;
      // Scale down so neither edge exceeds MAX_PX
      const scale = Math.min(1, MAX_PX / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      // Fill white so transparent PNGs don't get a black background
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, width: w, height: h });
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const fieldRow: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-ink-muted)",
};
const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
  borderRadius: "3px", padding: "0.6rem 0.8rem", color: "var(--color-ink)",
  fontFamily: "var(--font-body)", fontSize: "0.95rem", outline: "none", width: "100%",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImageUploader() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [compressed, setCompressed] = useState<Blob | null>(null);
  const [origSize, setOrigSize] = useState(0);
  const [compSize, setCompSize] = useState(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setError("");
    setCompressing(true);
    setOrigSize(file.size);

    try {
      const { blob, width, height } = await compressToJpeg(file);
      setCompressed(blob);
      setCompSize(blob.size);
      setDims({ w: width, h: height });

      // Replace stale preview URL
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(blob));

      // Auto-fill label from filename if field is empty
      if (!label) {
        setLabel(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
      }
    } catch {
      setError("Could not process image. Try a different file.");
    } finally {
      setCompressing(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!compressed) { setError("Please select an image."); return; }
    if (!label.trim()) { setError("Label is required."); return; }
    setError("");

    startTransition(async () => {
      const fd = new FormData();
      // Send as a proper File so server can read file.type
      fd.append("file", new File([compressed], "image.jpg", { type: "image/jpeg" }));
      fd.append("label", label.trim());
      fd.append("category", category);
      const result = await uploadImage(null, fd);
      // uploadImage redirects on success; only reaches here on error
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div style={{ maxWidth: "680px" }}>
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "var(--font-body)", fontSize: "0.88rem",
          color: "var(--color-ink-faint)", padding: 0, marginBottom: "1.5rem",
        }}
      >
        ← Back
      </button>

      <h2 style={{
        fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
        fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem",
      }}>
        Upload Image
      </h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "2rem" }}>
        Images are compressed before saving. They are stored in the database and survive redeploys.
      </p>

      {error && (
        <div role="alert" style={{
          background: "rgba(139,38,53,0.15)", border: "1px solid var(--color-crimson-dim)",
          borderRadius: "3px", padding: "0.7rem 1rem", color: "#d4848e",
          fontFamily: "var(--font-body)", fontSize: "0.9rem", marginBottom: "1.25rem",
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Drop zone / file picker ── */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed var(--color-border-light)",
            borderRadius: "4px",
            padding: preview ? "0" : "3rem 2rem",
            textAlign: "center",
            cursor: "pointer",
            overflow: "hidden",
            transition: "border-color 0.15s",
            minHeight: preview ? "0" : "160px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold-dim)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-light)")}
        >
          {compressing ? (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              Compressing…
            </p>
          ) : preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: "360px", display: "block", borderRadius: "2px" }}
            />
          ) : (
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "var(--color-ink-muted)", marginBottom: "0.4rem" }}>
                Click to choose an image
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)" }}>
                JPEG, PNG, WebP — any size
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* ── Compression info ── */}
        {compressed && !compressing && (
          <div style={{
            background: "rgba(76,139,64,0.08)", border: "1px solid rgba(76,139,64,0.25)",
            borderRadius: "3px", padding: "0.6rem 1rem",
            fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#8bc98d",
            display: "flex", gap: "1.5rem", flexWrap: "wrap",
          }}>
            <span>Compressed to {fmtBytes(compSize)} (from {fmtBytes(origSize)})</span>
            <span>{dims.w} × {dims.h} px · JPEG {Math.round(JPEG_QUALITY * 100)}%</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8bc98d", fontSize: "0.82rem", padding: 0, textDecoration: "underline" }}
            >
              Change image
            </button>
          </div>
        )}

        {/* ── Label ── */}
        <div style={fieldRow}>
          <label htmlFor="label" style={labelStyle}>Label / Caption *</label>
          <input
            id="label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Front cover draft, Elara sketch…"
            required
            style={inputStyle}
          />
        </div>

        {/* ── Category ── */}
        <div style={fieldRow}>
          <label htmlFor="category" style={labelStyle}>Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: "var(--color-bg-elevated)", textTransform: "capitalize" }}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* ── Submit ── */}
        <div>
          <button
            type="submit"
            disabled={pending || compressing || !compressed}
            style={{
              background: (pending || compressing || !compressed) ? "var(--color-border)" : "var(--color-crimson)",
              border: "none", borderRadius: "3px",
              padding: "0.7rem 1.5rem",
              color: "var(--color-ink)",
              fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.08em",
              cursor: (pending || compressing || !compressed) ? "default" : "pointer",
            }}
          >
            {pending ? "Uploading…" : compressing ? "Compressing…" : "Upload Image"}
          </button>
        </div>
      </form>
    </div>
  );
}
