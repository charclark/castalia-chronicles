// Plain constants — NOT a "use server" file.
// Kept separate because "use server" files may only export async functions.
export const DEFAULT_ROLES = [
  "Protagonist",
  "Antagonist",
  "Principal",
  "Supporting",
  "Wildcard",
  "Catalyst",
  "Shadow",
  "Minor",
] as const;
