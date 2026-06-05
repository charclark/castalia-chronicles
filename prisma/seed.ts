import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const hashed = await bcrypt.hash("Sadie", 12);

  // Upsert the primary admin account.
  // update: {} means: if "Char" already exists, leave the password untouched.
  // Only the initial create sets the password, so re-deploys never wipe changes.
  await prisma.user.upsert({
    where: { username: "Char" },
    update: {},
    create: { username: "Char", password: hashed },
  });

  console.log("✓ Admin account ready:");
  console.log("  Username: Char");
  console.log("  Password: Sadie  (only applies if the account was just created)");
  console.log("  → Change this password in Admin → Settings after logging in.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
