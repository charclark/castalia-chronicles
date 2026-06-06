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

// Returns the current user's effective permission for a universe,
// or null if they have no access. Super-admin always returns "super".
export async function getUniversePermission(
  universeId: string,
  userId: string,
  isSuperAdmin: boolean
): Promise<"super" | "edit" | "view" | null> {
  if (isSuperAdmin) return "super";
  const access = await prisma.universeAccess.findUnique({
    where: { universeId_userId: { universeId, userId } },
  });
  if (!access) return null;
  return access.permission as "edit" | "view";
}

// Use in write server actions — ensures the current user has edit access to the
// active universe. Throws a descriptive error if not.
export async function requireUniverseEdit(): Promise<{
  session: SessionPayload;
  universeId: string;
}> {
  const session = await requireAuth();
  const universeId = await getCurrentUniverseId();
  if (!session.isSuperAdmin) {
    const access = await prisma.universeAccess.findUnique({
      where: { universeId_userId: { universeId, userId: session.userId } },
    });
    if (!access) throw new Error("You do not have access to this universe.");
    if (access.permission !== "edit")
      throw new Error("You have view-only access to this universe.");
  }
  return { session, universeId };
}

// Returns all universes the current user can see.
// Everyone (including superadmin) sees only universes they created or were shared on.
// Superadmin additionally sees legacy universes with no recorded creator.
export async function getAccessibleUniverses(session: SessionPayload) {
  return prisma.universe.findMany({
    where: {
      archivedAt: null,
      OR: [
        { createdByUserId: session.userId },
        ...(session.isSuperAdmin ? [{ createdByUserId: null }] : []),
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
