"use server";

import { prisma } from "@/lib/prisma";

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function submitFeedback(
  name: string,
  email: string,
  message: string
): Promise<{ error?: string; success?: boolean }> {
  const n = name.trim();
  const e = email.trim();
  const m = message.trim();

  if (!n) return { error: "Please enter your name." };
  if (!m) return { error: "Message is required." };
  if (e && !isValidEmail(e)) return { error: "Please enter a valid email address." };

  try {
    await prisma.feedbackMessage.create({
      data: { name: n, email: e || null, message: m },
    });
    return { success: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function subscribeMailing(
  email: string,
  name?: string
): Promise<{ error?: string; success?: boolean; alreadySubscribed?: boolean }> {
  const e = email.trim();
  const n = (name ?? "").trim() || null;

  if (!e) return { error: "Email address is required." };
  if (!isValidEmail(e)) return { error: "Please enter a valid email address." };

  const existing = await prisma.mailingListEntry.findUnique({ where: { email: e } });
  if (existing) return { success: true, alreadySubscribed: true };

  try {
    await prisma.mailingListEntry.create({ data: { email: e, name: n } });
    return { success: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
