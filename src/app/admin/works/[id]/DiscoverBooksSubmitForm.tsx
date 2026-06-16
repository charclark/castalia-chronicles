"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { submitDiscoverBooks, unpublishDiscoverBooks } from "@/app/actions/discover-books-submissions";

// ── Types ─────────────────────────────────────────────────────────────────────

type ExistingSubmission = {
  id: string;
  bookTitle: string;
  authorName: string;
  coverBgIndex: number | null;
  hasCoverImage: boolean;
  purchaseUrl: string;
  purchaseLinkText: string;
  description: string;
  contentRating: string;
  status: string;
  submittedAt: string;
  rejectionNote: string | null;
} | null;

// ── Shared styles ─────────────────────────────────────────────────────────────

const fieldLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.3rem",
  display: "block",
};
const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
  borderRadius: "3px", padding: "0.6rem 0.8rem", color: "var(--color-ink)",
  fontFamily: "var(--font-body)", fontSize: "0.95rem", outline: "none", width: "100%",
};
const fieldWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };

// ── Cover overlay component (shared between preview and viewer side) ───────────

export function CoverOverlay({
  bgIndex,
  bookTitle,
  authorName,
  width = 200,
}: {
  bgIndex: number;
  bookTitle: string;
  authorName: string;
  width?: number;
}) {
  const height = Math.round(width * 1.5);
  return (
    <div style={{ position: "relative", width, height, flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/cover-backgrounds/cover-bg-${bgIndex}.jpg`}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {/* Gradient scrim */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.08) 100%)",
      }} />
      {/* Text */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "1rem 0.75rem 0.85rem",
        textAlign: "center",
      }}>
        {bookTitle && (
          <p style={{
            fontFamily: "var(--font-heading)", fontSize: `${Math.max(10, Math.round(width * 0.085))}px`,
            fontWeight: 400, color: "#fff", letterSpacing: "0.04em", lineHeight: 1.2,
            margin: "0 0 0.35rem", wordBreak: "break-word",
          }}>
            {bookTitle}
          </p>
        )}
        {authorName && (
          <p style={{
            fontFamily: "var(--font-body)", fontSize: `${Math.max(8, Math.round(width * 0.065))}px`,
            color: "rgba(255,255,255,0.75)", letterSpacing: "0.08em",
            margin: 0, wordBreak: "break-word",
          }}>
            {authorName}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Crop modal ────────────────────────────────────────────────────────────────

function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, crop.width, crop.height
  );
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

function CropModal({
  src,
  onDone,
  onCancel,
}: {
  src: string;
  onDone: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const c = centerCrop(makeAspectCrop({ unit: "%", width: 80 }, 2 / 3, width, height), width, height);
    setCrop(c);
  }

  async function handleApply() {
    if (!imgRef.current || !completedCrop) return;
    const blob = await getCroppedBlob(imgRef.current, completedCrop);
    if (blob) onDone(blob);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
        borderRadius: "6px", padding: "1.5rem", maxWidth: "640px", width: "100%",
        maxHeight: "90vh", overflow: "auto",
        display: "flex", flexDirection: "column", gap: "1rem",
      }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-ink)", margin: 0 }}>
          Crop Cover Image
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", margin: 0 }}>
          Drag to adjust the crop area. The cover will be 2:3 portrait ratio.
        </p>
        <div style={{ overflow: "auto" }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={2 / 3}
            minWidth={60}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ maxWidth: "100%", maxHeight: "60vh", display: "block" }}
            />
          </ReactCrop>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={{
            fontFamily: "var(--font-body)", fontSize: "0.88rem",
            background: "transparent", border: "1px solid var(--color-border)",
            borderRadius: "3px", padding: "0.5rem 1rem",
            color: "var(--color-ink-faint)", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button type="button" onClick={handleApply} disabled={!completedCrop} style={{
            fontFamily: "var(--font-body)", fontSize: "0.88rem",
            background: "var(--color-crimson)", border: "none",
            borderRadius: "3px", padding: "0.5rem 1.25rem",
            color: "var(--color-ink)", cursor: completedCrop ? "pointer" : "default",
            opacity: completedCrop ? 1 : 0.5,
          }}>
            Use This Crop
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status indicator ──────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { color: string; border: string; bg: string; label: string }> = {
    pending:  { color: "var(--color-gold)",    border: "var(--color-gold-dim)",    bg: "rgba(201,168,76,0.08)", label: "Awaiting approval" },
    approved: { color: "#8bc98d",              border: "rgba(76,139,64,0.35)",     bg: "rgba(76,139,64,0.08)", label: "Live on Discover Books" },
    rejected: { color: "#d4848e",              border: "var(--color-crimson-dim)", bg: "rgba(139,38,53,0.08)", label: "Not approved" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.1em",
      textTransform: "uppercase", color: s.color,
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: "2px", padding: "0.15rem 0.55rem",
    }}>
      {s.label}
    </span>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function DiscoverBooksSubmitForm({
  workId,
  workTitle,
  defaultAuthorName,
  existingSubmission,
}: {
  workId: string;
  workTitle: string;
  defaultAuthorName: string;
  existingSubmission: ExistingSubmission;
}) {
  const ex = existingSubmission;

  // Form state
  const [bookTitle, setBookTitle] = useState(ex?.bookTitle ?? workTitle);
  const [authorName, setAuthorName] = useState(ex?.authorName ?? defaultAuthorName);
  const [purchaseUrl, setPurchaseUrl] = useState(ex?.purchaseUrl ?? "");
  const [purchaseLinkText, setPurchaseLinkText] = useState(ex?.purchaseLinkText ?? "");
  const [description, setDescription] = useState(ex?.description ?? "");
  const [contentRating, setContentRating] = useState(ex?.contentRating ?? "General");

  // Cover state
  const [coverMode, setCoverMode] = useState<"none" | "upload" | "preset">(
    ex?.hasCoverImage ? "upload" : ex?.coverBgIndex ? "preset" : "none"
  );
  const [selectedBg, setSelectedBg] = useState<number | null>(ex?.coverBgIndex ?? null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // UI state
  const [editing, setEditing] = useState(!ex);
  const [status, setStatus] = useState(ex?.status ?? "");
  const [formError, setFormError] = useState("");
  const [submitPending, startSubmit] = useTransition();
  const [unpublishPending, startUnpublish] = useTransition();
  const [successBanner, setSuccessBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenFileRef = useRef<HTMLInputElement>(null);

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = wordCount > 100;

  const isApprovedLive = status === "approved";
  const showReplaceWarning = ex && isApprovedLive && editing;

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
      if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    };
  }, [croppedPreviewUrl, rawImageSrc]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(URL.createObjectURL(file));
    setShowCropModal(true);
  }

  function handleCropDone(blob: Blob) {
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    const url = URL.createObjectURL(blob);
    setCroppedBlob(blob);
    setCroppedPreviewUrl(url);
    setShowCropModal(false);
  }

  const handleSubmit = useCallback(async () => {
    setFormError("");
    setSuccessBanner(false);

    const fd = new FormData();
    fd.set("workId", workId);
    fd.set("bookTitle", bookTitle);
    fd.set("authorName", authorName);
    fd.set("purchaseUrl", purchaseUrl);
    fd.set("purchaseLinkText", purchaseLinkText);
    fd.set("description", description);
    fd.set("contentRating", contentRating);

    if (coverMode === "upload" && croppedBlob) {
      fd.set("coverFile", new File([croppedBlob], "cover.jpg", { type: "image/jpeg" }));
    } else if (coverMode === "upload" && ex?.hasCoverImage && !croppedBlob) {
      fd.set("keepCover", "1");
    } else if (coverMode === "preset" && selectedBg) {
      fd.set("coverBgIndex", String(selectedBg));
    }

    startSubmit(async () => {
      const result = await submitDiscoverBooks(null, fd);
      if (result.error) {
        setFormError(result.error);
      } else {
        setStatus("pending");
        setEditing(false);
        setSuccessBanner(true);
      }
    });
  }, [workId, bookTitle, authorName, purchaseUrl, purchaseLinkText, description, contentRating, coverMode, croppedBlob, selectedBg, ex]);

  // Determine cover preview src for existing submissions
  const existingCoverSrc = ex?.hasCoverImage ? `/api/discover-books-cover/${ex.id}` : null;

  // ── If not editing: show status card ─────────────────────────────────────────
  if (!editing && ex) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {successBanner && (
          <div style={{
            background: "rgba(76,139,64,0.1)", border: "1px solid rgba(76,139,64,0.35)",
            borderRadius: "4px", padding: "0.85rem 1.1rem",
            fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#8bc98d",
          }}>
            Your submission has been sent to WriteWright for approval. Stay tuned!
          </div>
        )}

        <div style={{
          background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
          borderRadius: "4px", padding: "1rem 1.25rem",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
            {/* Cover thumbnail */}
            {coverMode === "preset" && selectedBg ? (
              <CoverOverlay bgIndex={selectedBg} bookTitle={ex.bookTitle} authorName={ex.authorName} width={72} />
            ) : existingCoverSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={existingCoverSrc} alt="Cover" style={{ width: 72, height: 108, objectFit: "cover", borderRadius: "3px", border: "1px solid var(--color-border)", flexShrink: 0 }} />
            ) : ex.coverBgIndex ? (
              <CoverOverlay bgIndex={ex.coverBgIndex} bookTitle={ex.bookTitle} authorName={ex.authorName} width={72} />
            ) : null}

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink)", marginBottom: "0.2rem" }}>
                {ex.bookTitle}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)", marginBottom: "0.5rem" }}>
                by {ex.authorName}
              </p>
              <StatusPill status={status} />
              {status === "rejected" && ex.rejectionNote && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontStyle: "italic", color: "#d4848e", marginTop: "0.35rem" }}>
                  Feedback from WriteWright: {ex.rejectionNote}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => { setSuccessBanner(false); setEditing(true); }}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.82rem",
                background: "transparent", border: "1px solid var(--color-border)",
                borderRadius: "3px", padding: "0.35rem 0.85rem",
                color: "var(--color-ink-faint)", cursor: "pointer",
              }}
            >
              {status === "rejected" ? "Edit & Resubmit" : "Edit & Resubmit"}
            </button>

            {isApprovedLive && (
              <button
                type="button"
                disabled={unpublishPending}
                onClick={() => {
                  if (!window.confirm("Are you sure you want to remove this from Discover Books? It will no longer be visible to readers.")) return;
                  startUnpublish(async () => {
                    await unpublishDiscoverBooks(workId);
                    setStatus("rejected");
                  });
                }}
                style={{
                  fontFamily: "var(--font-body)", fontSize: "0.82rem",
                  background: "transparent", border: "1px solid var(--color-crimson-dim)",
                  borderRadius: "3px", padding: "0.35rem 0.85rem",
                  color: "#d4848e", cursor: unpublishPending ? "default" : "pointer",
                  opacity: unpublishPending ? 0.5 : 1,
                }}
              >
                Unpublish
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Edit form ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Replace warning */}
      {showReplaceWarning && (
        <div style={{
          background: "rgba(201,168,76,0.08)", border: "1px solid var(--color-gold-dim)",
          borderRadius: "4px", padding: "0.85rem 1.1rem",
          fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-gold)", lineHeight: 1.6,
        }}>
          You currently have an approved listing for this work on Discover Books. Submitting a new version will replace the existing one and remove it from public view until the new version is approved by WriteWright.
        </div>
      )}

      {showCropModal && rawImageSrc && (
        <CropModal
          src={rawImageSrc}
          onDone={handleCropDone}
          onCancel={() => setShowCropModal(false)}
        />
      )}

      {/* Book title */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Book Title</label>
        <input
          type="text"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Author name */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Author Name</label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          style={inputStyle}
        />
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", margin: 0 }}>
          This is the name that appears on the cover and the listing.
        </p>
      </div>

      {/* Cover image */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Cover Image</label>

        {/* Mode selector */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {(["upload", "preset"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setCoverMode(m)}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.82rem",
                background: coverMode === m ? "rgba(201,168,76,0.08)" : "transparent",
                border: `1px solid ${coverMode === m ? "var(--color-gold-dim)" : "var(--color-border)"}`,
                borderRadius: "3px", padding: "0.35rem 0.85rem",
                color: coverMode === m ? "var(--color-gold)" : "var(--color-ink-faint)",
                cursor: "pointer",
              }}
            >
              {m === "upload" ? "Upload your own cover" : "Choose a preset background"}
            </button>
          ))}
        </div>

        {coverMode === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <input ref={hiddenFileRef} type="file" name="coverFile" style={{ display: "none" }} />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.85rem",
                background: "transparent", border: "1px solid var(--color-border)",
                borderRadius: "3px", padding: "0.5rem 1rem",
                color: "var(--color-ink-muted)", cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >
              {croppedPreviewUrl || ex?.hasCoverImage ? "Replace image…" : "Choose image…"}
            </button>

            {/* Preview */}
            {croppedPreviewUrl ? (
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", marginBottom: "0.4rem" }}>
                  Preview
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={croppedPreviewUrl} alt="Cover preview" style={{ width: 140, height: 210, objectFit: "cover", borderRadius: "3px", border: "1px solid var(--color-border)", display: "block" }} />
              </div>
            ) : existingCoverSrc ? (
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", marginBottom: "0.4rem" }}>
                  Current cover
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={existingCoverSrc} alt="Current cover" style={{ width: 140, height: 210, objectFit: "cover", borderRadius: "3px", border: "1px solid var(--color-border)", display: "block" }} />
              </div>
            ) : null}
          </div>
        )}

        {coverMode === "preset" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Preset grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSelectedBg(n)}
                  style={{
                    padding: 0, border: `2px solid ${selectedBg === n ? "var(--color-gold)" : "transparent"}`,
                    borderRadius: "3px", overflow: "hidden", cursor: "pointer", background: "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/cover-backgrounds/cover-bg-${n}.jpg`}
                    alt={`Background ${n}`}
                    style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", display: "block" }}
                  />
                </button>
              ))}
            </div>

            {/* Live cover preview */}
            {selectedBg && (
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", marginBottom: "0.5rem" }}>
                  Cover preview
                </p>
                <CoverOverlay bgIndex={selectedBg} bookTitle={bookTitle} authorName={authorName} width={160} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Purchase URL */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Purchase Link URL</label>
        <input
          type="url"
          value={purchaseUrl}
          onChange={(e) => setPurchaseUrl(e.target.value)}
          placeholder="https://…"
          style={inputStyle}
        />
      </div>

      {/* Purchase link display text */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Purchase Link Display Text</label>
        <input
          type="text"
          value={purchaseLinkText}
          onChange={(e) => setPurchaseLinkText(e.target.value)}
          placeholder="e.g. Available on Amazon, Buy it here, Get it on Gumroad"
          style={inputStyle}
        />
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", margin: 0 }}>
          What readers see as the link text.
        </p>
      </div>

      {/* Description */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Short Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="A compelling summary for readers…"
          style={{
            ...inputStyle,
            fontFamily: "var(--font-body)",
            lineHeight: 1.7,
            resize: "vertical",
          }}
        />
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.75rem",
          color: isOverLimit ? "#d4848e" : "var(--color-ink-faint)",
          margin: 0,
        }}>
          {wordCount} / 100 words{isOverLimit ? " — over limit" : ""}
        </p>
      </div>

      {/* Content rating */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Content Rating</label>
        <select
          value={contentRating}
          onChange={(e) => setContentRating(e.target.value)}
          style={{ ...inputStyle, fontSize: "0.92rem" }}
        >
          <option value="General">General</option>
          <option value="Teen">Teen</option>
          <option value="Mature Themes">Mature Themes</option>
          <option value="Adult">Adult</option>
        </select>
      </div>

      {formError && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#d4848e", margin: 0 }}>
          {formError}
        </p>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitPending || isOverLimit}
          style={{
            fontFamily: "var(--font-body)", fontSize: "0.9rem",
            background: submitPending || isOverLimit ? "var(--color-border)" : "var(--color-crimson)",
            border: "none", borderRadius: "3px",
            padding: "0.65rem 1.4rem", color: "var(--color-ink)",
            cursor: submitPending || isOverLimit ? "default" : "pointer",
          }}
        >
          {submitPending ? "Submitting…" : "Submit for Approval"}
        </button>

        {ex && (
          <button
            type="button"
            onClick={() => { setEditing(false); setFormError(""); }}
            style={{
              fontFamily: "var(--font-body)", fontSize: "0.88rem",
              background: "transparent", border: "1px solid var(--color-border)",
              borderRadius: "3px", padding: "0.6rem 1rem",
              color: "var(--color-ink-faint)", cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
