"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getSession } from "@/lib/session";

export type AuthState = {
  error?: string;
  success?: string;
} | null;

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

  await createSession({ userId: user.id, username: user.username });
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

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
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
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

export async function createUser(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!username || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }
  if (username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "That username is already taken." };
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { username, password: hashed },
  });

  return { success: `User "${username}" created successfully.` };
}
