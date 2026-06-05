"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { requireSuperAdmin, validatePassword } from "@/lib/auth-utils";

export type AuthState = {
  error?: string;
  success?: string;
} | null;

// ── Login / Logout ────────────────────────────────────────────────────────────

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Please enter your username and password." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Invalid username or password." };
  }

  await createSession({
    userId: user.id,
    username: user.username,
    isSuperAdmin: user.isSuperAdmin,
  });
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

// ── Change own password ───────────────────────────────────────────────────────

export async function changePassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  // Password strength required for all users except the super-admin
  if (!session.isSuperAdmin) {
    const err = validatePassword(newPassword);
    if (err) return { error: err };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return { error: "Current password is incorrect." };
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.userId },
    data: { password: hashed },
  });

  return { success: "Password updated successfully." };
}

// ── Forgot password (login screen self-service) ───────────────────────────────
// Generates a temporary password shown on-screen. Blocked for the super-admin
// account to prevent public hijacking of that account.

export async function requestTempPassword(
  username: string
): Promise<{ tempPassword?: string; error?: string }> {
  const trimmed = username.trim();
  if (!trimmed) return { error: "Please enter your username." };

  const user = await prisma.user.findUnique({ where: { username: trimmed } });
  if (!user) return { error: "No account found with that username." };

  // Block self-service reset for the super-admin account
  if (user.isSuperAdmin) {
    return { error: "That account cannot be reset this way. Please contact the site owner." };
  }

  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let tempPassword = "";
  // Ensure requirements are met: one uppercase, one digit, one special, rest random
  tempPassword += "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)];
  tempPassword += "23456789"[Math.floor(Math.random() * 8)];
  tempPassword += "!@#$"[Math.floor(Math.random() * 4)];
  for (let i = 3; i < 10; i++) {
    tempPassword += chars[Math.floor(Math.random() * chars.length)];
  }
  // Shuffle
  tempPassword = tempPassword.split("").sort(() => Math.random() - 0.5).join("");

  const hashed = await bcrypt.hash(tempPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return { tempPassword };
}

// ── User management (super-admin only) ───────────────────────────────────────

export async function createUser(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  await requireSuperAdmin();

  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!username || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }
  if (username.length < 2) {
    return { error: "Username must be at least 2 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const err = validatePassword(password);
  if (err) return { error: err };

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "That username is already taken." };
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { username, password: hashed } });

  return { success: `User "${username}" created.` };
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const session = await requireSuperAdmin();

  if (userId === session.userId) {
    return { error: "You cannot delete your own account." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };
  if (user.isSuperAdmin) return { error: "Cannot delete the super-admin account." };

  await prisma.user.delete({ where: { id: userId } });
  return {};
}

export async function adminResetPassword(
  userId: string,
  newPassword: string
): Promise<{ error?: string; success?: string }> {
  await requireSuperAdmin();

  if (!newPassword) return { error: "Password is required." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };
  if (user.isSuperAdmin) return { error: "Cannot reset the super-admin password this way." };

  const err = validatePassword(newPassword);
  if (err) return { error: err };

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return { success: `Password reset for "${user.username}".` };
}
