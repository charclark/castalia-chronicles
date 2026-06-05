"use client";

import TwoStepDestroyConfirm from "./TwoStepDestroyConfirm";

export default function DestroyUniverseConfirm({
  universeName,
  onConfirm,
  onCancel,
}: {
  universeName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <TwoStepDestroyConfirm
      firstWarningBody="You're about to destroy a universe!!"
      itemName={universeName}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
