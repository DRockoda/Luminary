import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { MOODS } from "@luminary/shared";
import { DEFAULT_SETTINGS } from "../src/lib/defaults.js";
import { encryptString, generateSalt } from "../src/lib/crypto.js";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@luminary.app";
  const password = "demo1234";

  await prisma.user.deleteMany({ where: { email } });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: "Demo",
      encryptionSalt: generateSalt(16),
      settings: JSON.stringify(DEFAULT_SETTINGS),
    },
  });

  const today = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    if (i % 4 === 0) continue; // skip some days to show gaps
    const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
    await prisma.moodLog.create({ data: { userId: user.id, date, mood } });
    if (i % 3 === 0) {
      await prisma.entry.create({
        data: {
          userId: user.id,
          date,
          type: "text",
          title: "Morning thoughts",
          content: encryptString(
            "Feeling grateful today. Took a slow walk, thought about what actually matters.",
          ),
        },
      });
    }
    if (i % 5 === 0) {
      await prisma.entry.create({
        data: {
          userId: user.id,
          date,
          type: "audio",
          title: "Voice memo",
          durationSeconds: 42 + i,
          mediaUrl: null,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded demo user: ${email} / ${password}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
