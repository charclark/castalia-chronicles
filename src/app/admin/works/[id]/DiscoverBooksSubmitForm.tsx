"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  submitDiscoverBooks,
  withdrawDiscoverBooks,
  unpublishDiscoverBooks,
} from "@/app/actions/discover-books-submissions";

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
  hasPendingEdit: boolean;
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

// ── Cover overlay component ────────────────────────────────────────────────────

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
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.08) 100%)",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "1rem 0.75rem 0.85rem", textAlign: "center",
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

function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

function CropModal({ src, onDone, onCancel }: { src: string; onDone: (blob: Blob) => void; onCancel: () => void }) {
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "1.5rem", maxWidth: "640px", width: "100%", maxHeight: "90vh", overflow: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-ink)", margin: 0 }}>Crop Cover Image</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", margin: 0 }}>Drag to adjust the crop area. The cover will be 2:3 portrait ratio.</p>
        <div style={{ overflow: "auto" }}>
          <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={2 / 3} minWidth={60}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={src} alt="Crop preview" onLoad={onImageLoad} style={{ maxWidth: "100%", maxHeight: "60vh", display: "block" }} />
          </ReactCrop>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.5rem 1rem", color: "var(--color-ink-faint)", cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={handleApply} disabled={!completedCrop} style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", background: "var(--color-crimson)", border: "none", borderRadius: "3px", padding: "0.5rem 1.25rem", color: "var(--color-ink)", cursor: completedCrop ? "pointer" : "default", opacity: completedCrop ? 1 : 0.5 }}>Use This Crop</button>
        </div>
      </div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status, label }: { status: string; label: string }) {
  const map: Record<string, { color: string; border: string; bg: string }> = {
    pending:  { color: "var(--color-gold)",    border: "var(--color-gold-dim)",    bg: "rgba(201,168,76,0.08)" },
    approved: { color: "#8bc98d",              border: "rgba(76,139,64,0.35)",     bg: "rgba(76,139,64,0.08)" },
    rejected: { color: "#d4848e",              border: "var(--color-crimson-dim)", bg: "rgba(139,38,53,0.08)" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: "2px", padding: "0.1rem 0.5rem", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// ── STATE A: Never submitted ───────────────────────────────────────────────────

function NeverSubmittedState({ onBegin }: { onBegin: () => void }) {
  return (
    <button
      type="button"
      onClick={onBegin}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem",
        background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
        borderRadius: "4px", padding: "1rem 1.25rem", cursor: "pointer", textAlign: "left", width: "100%",
        transition: "border-color 0.15s",
      }}
    >
      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-ink-faint)" }}>Option 2</span>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.04em", color: "var(--color-ink)" }}>List on Discover Books — Sell Your Work</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)", lineHeight: 1.5 }}>
        List your published book for sale. Share your cover, a short description, and a purchase link. No written content is shared — this is a storefront listing only.
      </span>
    </button>
  );
}

// ── STATE B: Pending approval ─────────────────────────────────────────────────

function PendingState({ ex, onWithdraw }: { ex: NonNullable<ExistingSubmission>; onWithdraw: () => void }) {
  const submitted = new Date(ex.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "1.1rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <StatusPill status="pending" label="Pending — Awaiting Approval" />
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink)" }}>{ex.bookTitle}</p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)" }}>by {ex.authorName} · Submitted {submitted} · Discover Books</p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontStyle: "italic", color: "var(--color-ink-faint)" }}>You'll hear back once Char has reviewed your listing.</p>
      <button type="button" onClick={onWithdraw} style={{ alignSelf: "flex-start", fontFamily: "var(--font-body)", fontSize: "0.8rem", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.3rem 0.85rem", color: "var(--color-ink-faint)", cursor: "pointer" }}>
        Withdraw Submission
      </button>
    </div>
  );
}

// ── STATE C: Approved / live ──────────────────────────────────────────────────

function ApprovedState({ ex, onSubmitNew, onUnpublish }: { ex: NonNullable<ExistingSubmission>; onSubmitNew: () => void; onUnpublish: () => void }) {
  return (
    <div style={{ background: "var(--color-bg-elevated)", border: "1px solid rgba(76,139,64,0.25)", borderRadius: "4px", padding: "1.1rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <StatusPill status="approved" label="Approved — Live on Discover Books" />
        {ex.hasPendingEdit && (
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gold)", background: "rgba(201,168,76,0.08)", border: "1px solid var(--color-gold-dim)", borderRadius: "2px", padding: "0.1rem 0.5rem" }}>
            Edit pending review
          </span>
        )}
      </div>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink)" }}>{ex.bookTitle}</p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)" }}>by {ex.authorName}</p>
      {ex.hasPendingEdit && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontStyle: "italic", color: "var(--color-gold)" }}>
          A new version is awaiting Char's approval. Your live listing stays visible until it's approved.
        </p>
      )}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button type="button" onClick={onSubmitNew} style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.3rem 0.85rem", color: "var(--color-ink-muted)", cursor: "pointer" }}>
          Submit a New Version
        </button>
        <button type="button" onClick={onUnpublish} style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", background: "transparent", border: "1px solid var(--color-crimson-dim)", borderRadius: "3px", padding: "0.3rem 0.85rem", color: "#d4848e", cursor: "pointer" }}>
          Unpublish
        </button>
      </div>
    </div>
  );
}

// ── STATE D: Rejected ─────────────────────────────────────────────────────────

function RejectedState({ ex, onSubmitAgain }: { ex: NonNullable<ExistingSubmission>; onSubmitAgain: () => void }) {
  return (
    <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "1.1rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <StatusPill status="rejected" label="Not Approved" />
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink)" }}>{ex.bookTitle}</p>
      {ex.rejectionNote && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontStyle: "italic", color: "#d4848e" }}>
          Feedback from WriteWright: {ex.rejectionNote}
        </p>
      )}
      <button type="button" onClick={onSubmitAgain} style={{ alignSelf: "flex-start", fontFamily: "var(--font-body)", fontSize: "0.8rem", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.3rem 0.85rem", color: "var(--color-ink-muted)", cursor: "pointer" }}>
        Submit Again
      </button>
    </div>
  );
}

// ── Discover Books submission form ────────────────────────────────────────────

function DiscoverBooksForm({
  workId,
  workTitle,
  defaultAuthorName,
  existingSubmission,
  isEdit,
  onSuccess,
  onCancel,
}: {
  workId: string;
  workTitle: string;
  defaultAuthorName: string;
  existingSubmission: ExistingSubmission;
  isEdit: boolean;
  onSuccess: (result: "submitted" | "edit_pending") => void;
  onCancel: () => void;
}) {
  const ex = existingSubmission;

  const [bookTitle, setBookTitle] = useState(ex?.bookTitle ?? workTitle);
  const [authorName, setAuthorName] = useState(ex?.authorName ?? defaultAuthorName);
  const [purchaseUrl, setPurchaseUrl] = useState(ex?.purchaseUrl ?? "");
  const [purchaseLinkText, setPurchaseLinkText] = useState(ex?.purchaseLinkText ?? "");
  const [description, setDescription] = useState(ex?.description ?? "");
  const [contentRating, setContentRating] = useState(ex?.contentRating ?? "General");

  const [coverMode, setCoverMode] = useState<"none" | "upload" | "preset">(
    ex?.hasCoverImage ? "upload" : ex?.coverBgIndex ? "preset" : "none"
  );
  const [selectedBg, setSelectedBg] = useState<number | null>(ex?.coverBgIndex ?? null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitPending, startSubmit] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = wordCount > 100;

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
    setCroppedBlob(blob);
    setCroppedPreviewUrl(URL.createObjectURL(blob));
    setShowCropModal(false);
  }

  const handleSubmit = useCallback(async () => {
    setFormError("");
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
      } else if (result.success === "edit_pending") {
        onSuccess("edit_pending");
      } else {
        onSuccess("submitted");
      }
    });
  }, [workId, bookTitle, authorName, purchaseUrl, purchaseLinkText, description, contentRating, coverMode, croppedBlob, selectedBg, ex, onSuccess]);

  const existingCoverSrc = ex?.hasCoverImage ? `/api/discover-books-cover/${ex.id}` : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {isEdit && (
        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid var(--color-gold-dim)", borderLeft: "3px solid var(--color-gold)", borderRadius: "4px", padding: "0.85rem 1.1rem" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-gold)", margin: 0 }}>
            Your current published listing will remain live until your new version is approved by WriteWright.
          </p>
        </div>
      )}

      {showCropModal && rawImageSrc && (
        <CropModal src={rawImageSrc} onDone={handleCropDone} onCancel={() => setShowCropModal(false)} />
      )}

      {/* Book title */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Book Title</label>
        <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} style={inputStyle} />
      </div>

      {/* Author name */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Author Name</label>
        <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} style={inputStyle} />
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", margin: 0 }}>
          This is the name that appears on the cover and the listing.
        </p>
      </div>

      {/* Cover image */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Cover Image</label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {(["upload", "preset"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setCoverMode(m)} style={{
              fontFamily: "var(--font-body)", fontSize: "0.82rem",
              background: coverMode === m ? "rgba(201,168,76,0.08)" : "transparent",
              border: `1px solid ${coverMode === m ? "var(--color-gold-dim)" : "var(--color-border)"}`,
              borderRadius: "3px", padding: "0.35rem 0.85rem",
              color: coverMode === m ? "var(--color-gold)" : "var(--color-ink-faint)", cursor: "pointer",
            }}>
              {m === "upload" ? "Upload your own cover" : "Choose a preset background"}
            </button>
          ))}
        </div>

        {coverMode === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.5rem 1rem", color: "var(--color-ink-muted)", cursor: "pointer", alignSelf: "flex-start" }}>
              {croppedPreviewUrl || ex?.hasCoverImage ? "Replace image…" : "Choose image…"}
            </button>
            {croppedPreviewUrl ? (
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", marginBottom: "0.4rem" }}>Preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={croppedPreviewUrl} alt="Cover preview" style={{ width: 140, height: 210, objectFit: "cover", borderRadius: "3px", border: "1px solid var(--color-border)", display: "block" }} />
              </div>
            ) : existingCoverSrc ? (
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", marginBottom: "0.4rem" }}>Current cover</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={existingCoverSrc} alt="Current cover" style={{ width: 140, height: 210, objectFit: "cover", borderRadius: "3px", border: "1px solid var(--color-border)", display: "block" }} />
              </div>
            ) : null}
          </div>
        )}

        {coverMode === "preset" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => setSelectedBg(n)} style={{ padding: 0, border: `2px solid ${selectedBg === n ? "var(--color-gold)" : "transparent"}`, borderRadius: "3px", overflow: "hidden", cursor: "pointer", background: "none" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/cover-backgrounds/cover-bg-${n}.jpg`} alt={`Background ${n}`} style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
            {selectedBg && (
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", marginBottom: "0.5rem" }}>Cover preview</p>
                <CoverOverlay bgIndex={selectedBg} bookTitle={bookTitle} authorName={authorName} width={160} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Purchase URL */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Purchase Link URL</label>
        <input type="url" value={purchaseUrl} onChange={(e) => setPurchaseUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
      </div>

      {/* Purchase link text */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Purchase Link Display Text</label>
        <input type="text" value={purchaseLinkText} onChange={(e) => setPurchaseLinkText(e.target.value)} placeholder="e.g. Available on Amazon, Buy it here" style={inputStyle} />
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", margin: 0 }}>What readers see as the link text.</p>
      </div>

      {/* Description */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Short Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
          placeholder="A compelling summary for readers…"
          style={{ ...inputStyle, fontFamily: "var(--font-body)", lineHeight: 1.7, resize: "vertical" }} />
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: isOverLimit ? "#d4848e" : "var(--color-ink-faint)", margin: 0 }}>
          {wordCount} / 100 words{isOverLimit ? " — over limit" : ""}
        </p>
      </div>

      {/* Content rating */}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Content Rating</label>
        <select value={contentRating} onChange={(e) => setContentRating(e.target.value)} style={{ ...inputStyle, fontSize: "0.92rem" }}>
          <option value="General">General</option>
          <option value="Teen">Teen</option>
          <option value="Mature Themes">Mature Themes</option>
          <option value="Adult">Adult</option>
        </select>
      </div>

      {formError && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#d4848e", margin: 0 }}>{formError}</p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={handleSubmit} disabled={submitPending || isOverLimit} style={{
          fontFamily: "var(--font-body)", fontSize: "0.9rem",
          background: submitPending || isOverLimit ? "var(--color-border)" : "var(--color-crimson)",
          border: "none", borderRadius: "3px", padding: "0.65rem 1.4rem", color: "var(--color-ink)",
          cursor: submitPending || isOverLimit ? "default" : "pointer",
        }}>
          {submitPending ? "Submitting…" : isEdit ? "Submit New Version" : "Submit for Approval"}
        </button>
        <button type="button" onClick={onCancel} style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.6rem 1rem", color: "var(--color-ink-faint)", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

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
  const router = useRouter();
  const ex = existingSubmission;

  type LocalStatus = "none" | "pending" | "approved" | "rejected";
  const [localStatus, setLocalStatus] = useState<LocalStatus>(
    ex ? (ex.status as LocalStatus) : "none"
  );
  const [hasPendingEdit, setHasPendingEdit] = useState(ex?.hasPendingEdit ?? false);
  const [showForm, setShowForm] = useState(false);
  const [actionPending, startTransition] = useTransition();

  function handleWithdraw() {
    if (!window.confirm("Are you sure you want to withdraw this submission?")) return;
    startTransition(async () => {
      await withdrawDiscoverBooks(workId);
      setLocalStatus("none");
      router.refresh();
    });
  }

  function handleUnpublish() {
    if (!window.confirm("Are you sure you want to remove this from Discover Books? It will no longer be visible to readers.")) return;
    startTransition(async () => {
      await unpublishDiscoverBooks(workId);
      setLocalStatus("rejected");
      setHasPendingEdit(false);
    });
  }

  function handleFormSuccess(result: "submitted" | "edit_pending") {
    setShowForm(false);
    if (result === "edit_pending") {
      setHasPendingEdit(true);
    } else {
      setLocalStatus("pending");
    }
  }

  if (showForm) {
    return (
      <DiscoverBooksForm
        workId={workId}
        workTitle={workTitle}
        defaultAuthorName={defaultAuthorName}
        existingSubmission={ex ? { ...ex, hasPendingEdit } : null}
        isEdit={localStatus === "approved"}
        onSuccess={handleFormSuccess}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div style={{ opacity: actionPending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      {localStatus === "none" && <NeverSubmittedState onBegin={() => setShowForm(true)} />}
      {localStatus === "pending" && ex && <PendingState ex={ex} onWithdraw={handleWithdraw} />}
      {localStatus === "approved" && ex && (
        <ApprovedState
          ex={{ ...ex, hasPendingEdit }}
          onSubmitNew={() => setShowForm(true)}
          onUnpublish={handleUnpublish}
        />
      )}
      {localStatus === "rejected" && ex && <RejectedState ex={ex} onSubmitAgain={() => setShowForm(true)} />}
    </div>
  );
}
