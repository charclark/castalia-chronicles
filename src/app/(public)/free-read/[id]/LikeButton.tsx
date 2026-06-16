"use client";

import { useState, useTransition } from "react";
import { likeFreeRead } from "@/app/actions/free-read-submissions";

export default function LikeButton({
  submissionId,
  initialCount,
}: {
  submissionId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleLike() {
    if (liked || pending) return;
    setLiked(true);
    setCount((c) => c + 1);
    startTransition(async () => {
      const result = await likeFreeRead(submissionId);
      setCount(result.count);
      setLiked(result.liked);
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <button
        type="button"
        onClick={handleLike}
        disabled={liked || pending}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.35rem 0.85rem",
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
        <span style={{ fontSize: "1rem" }}>👍</span>
        {liked ? "Liked" : "Like this"}
      </button>
      {count > 0 && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            color: "var(--color-ink-faint)",
          }}
        >
          Liked by {count.toLocaleString()} reader{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
