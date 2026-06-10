import "server-only";
import { redirect } from "next/navigation";
import { getSession, SessionPayload } from "./session";
import { prisma } from "./prisma";
import { getCurrentUniverseId } from "./universe";

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireSuperAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isSuperAdmin) throw new Error("Access denied.");
  return session;
}

// Returns the current user's effective permission for a universe.
// Ownership (createdByUserId) always grants "edit".
// Falls back to explicit UniverseAccess record.
// Returns null if the user has no access at all.
export async function getUniversePermission(
  universeId: string,
  userId: string,
  _isSuperAdmin?: boolean
): Promise<"edit" | "view" | null> {
  const universe = await prisma.universe.findUnique({
    where: { id: universeId },
    select: { createdByUserId: true },
  });
  if (universe?.createdByUserId === userId) return "edit";

  const access = await prisma.universeAccess.findUnique({
    where: { universeId_userId: { universeId, userId } },
  });
  if (!access) return null;
  return access.permission as "edit" | "view";
}

// Use in write server actions — ensures the current user has edit access to the
// active universe. Accepts universe owners (createdByUserId) and users with an
// explicit "edit" UniverseAccess record. Throws a descriptive error if not.
export async function requireUniverseEdit(): Promise<{
  session: SessionPayload;
  universeId: string;
}> {
  const session = await requireAuth();
  const universeId = await getCurrentUniverseId();

  const universe = await prisma.universe.findUnique({
    where: { id: universeId },
    select: { createdByUserId: true },
  });
  if (!universe) throw new Error("Universe not found.");

  // Owners always have edit access.
  if (universe.createdByUserId === session.userId) {
    return { session, universeId };
  }

  // Check explicit access record.
  const access = await prisma.universeAccess.findUnique({
    where: { universeId_userId: { universeId, userId: session.userId } },
  });
  if (!access) throw new Error("You do not have access to this universe.");
  if (access.permission !== "edit")
    throw new Error("You have view-only access to this universe.");

  return { session, universeId };
}

// Returns true if the current session user has edit access to the given
// universe (owner or explicit edit grant). Safe to call from page components.
export async function getCanEditUniverse(universeId: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const perm = await getUniversePermission(universeId, session.userId);
  return perm === "edit";
}

// Returns all universes the current user can see (owns or has been shared on).
// Everyone follows the same visibility rules — no superadmin exceptions.
export async function getAccessibleUniverses(session: SessionPayload) {
  return prisma.universe.findMany({
    where: {
      archivedAt: null,
      OR: [
        { createdByUserId: session.userId },
        { accesses: { some: { userId: session.userId } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, isPrivate: true },
  });
}

// Validates password strength for non-super-admin users.
// Returns an error string or null if valid.
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password))
    return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must contain at least one special character.";
  return null;
}
