import bcrypt from "bcrypt";
import readline from "node:readline";
import { prisma } from "../db.js";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) =>
  new Promise<string>((resolve) => rl.question(q, (a) => resolve(a)));

async function main() {
  // eslint-disable-next-line no-console
  console.log("\nLuminary — Create admin user\n");
  const username = (await ask("Admin username: ")).trim();
  if (!username) throw new Error("Username is required");
  const password = (await ask("Admin password (min 8 chars): ")).trim();
  if (password.length < 8) throw new Error("Password must be at least 8 characters");

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) {
    const yn = (await ask(`Admin '${username}' already exists. Overwrite? (y/N): `)).trim();
    if (yn.toLowerCase() !== "y") {
      // eslint-disable-next-line no-console
      console.log("Aborted.");
      rl.close();
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
    // eslint-disable-next-line no-console
    console.log(`Updated password for admin '${username}'.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.create({ data: { username, passwordHash } });
    // eslint-disable-next-line no-console
    console.log(`Created admin '${username}'.`);
  }

  rl.close();
  await prisma.$disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  rl.close();
  process.exit(1);
});
