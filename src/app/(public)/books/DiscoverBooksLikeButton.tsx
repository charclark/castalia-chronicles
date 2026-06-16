"use client";

import { useState, useTransition } from "react";
import { likeDiscoverBooks } from "@/app/actions/discover-books-submissions";

export default function DiscoverBooksLikeButton({
  submissionId,
  initialCount,
}: {
  submissionId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (liked || pending) return;
    setLiked(true);
    setCount((c) => c + 1);
    startTransition(async () => {
      const result = await likeDiscoverBooks(submissionId);
      setCount(result.count);
      setLiked(result.liked);
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.75rem" }}>
      <button
        type="button"
        onClick={handleLike}
        disabled={liked || pending}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.78rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.25rem 0.65rem",
          borderRadius: "3px",
          border: liked
            ? "1px solid rgba(76,139,64,0.35)"
            : "1px solid var(--color-border)",
          background: liked ? "rgba(76,139,64,0.08)" : "transparent",
          color: liked ? "#8bc98d" : "var(--color-ink-faint)",
          cursor: liked || pending ? "default" : "pointer",
          transition: "all 0.15s",
        }}
      >
        <span>👍</span>
        {liked ? "Liked" : "Like"}
      </button>
      {count > 0 && (
        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)" }}>
          Liked by {count.toLocaleString()} reader{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
