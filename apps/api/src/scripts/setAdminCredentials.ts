import "dotenv/config";

/**
 * Upsert an AdminUser. Pass credentials via env (never commit real values):
 *
 *   ADMIN_USERNAME=Fizix ADMIN_PASSWORD='...' npx tsx src/scripts/setAdminCredentials.ts
 */
import bcrypt from "bcrypt";
import { prisma } from "../db.js";

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username) {
    throw new Error("Set ADMIN_USERNAME");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) {
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
    // eslint-disable-next-line no-console
    console.log(`Updated password for admin '${username}'.`);
  } else {
    await prisma.adminUser.create({ data: { username, passwordHash } });
    // eslint-disable-next-line no-console
    console.log(`Created admin '${username}'.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
