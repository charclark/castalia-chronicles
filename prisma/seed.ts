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
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(
      `✓ ${count} user(s) already exist — skipping seed. Use the admin panel to add users.`
    );
    return;
  }

  const hashed = await bcrypt.hash("Castalia2024!", 12);
  await prisma.user.create({
    data: { username: "admin", password: hashed },
  });

  console.log("✓ First admin account created:");
  console.log("  Username: admin");
  console.log("  Password: Castalia2024!");
  console.log("  → Change this password immediately after your first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
