import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { MOOD_TAGS } from "@luminary/shared";
import { DEFAULT_SETTINGS } from "../src/lib/defaults.js";
import { encryptString, generateSalt } from "../src/lib/crypto.js";

const prisma = new PrismaClient();

/** Seeded test user — verified so `/api/auth/login` works without OTP. */
const TEST_EMAIL = "test@luminary.app";
const TEST_PASSWORD = "TestPass123!";

async function main() {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const user = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      passwordHash,
      displayName: "Test User",
      encryptionSalt: generateSalt(16),
      settings: JSON.stringify(DEFAULT_SETTINGS),
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });

  const today = new Date();
  const sampleNotes = [
    "Kickoff for the week — coffee, a short walk, and one clear priority.",
    "Logged a win at work and still made time to decompress.",
    "Heavy day. Wrote this down so tomorrow-me remembers it gets easier.",
    "Grateful for small things: sunlight, water, a message from a friend.",
    "Tried the breathing exercise from settings. Actually helped.",
  ];

  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const tag = MOOD_TAGS[i % MOOD_TAGS.length];

    await prisma.moodLog.upsert({
      where: { userId_date: { userId: user.id, date } },
      create: { userId: user.id, date, mood: tag },
      update: { mood: tag },
    });

    if (i % 2 === 0) {
      const moodScore = 3 + (i % 8);
      await prisma.entry.create({
        data: {
          userId: user.id,
          date,
          type: "text",
          title: i === 0 ? "Today" : `Journal — ${date}`,
          content: encryptString(sampleNotes[i % sampleNotes.length]),
          moodScore,
        },
      });
    }

    if (i % 4 === 0 && i > 0) {
      await prisma.entry.create({
        data: {
          userId: user.id,
          date,
          type: "audio",
          title: "Quick voice note",
          durationSeconds: 30 + (i % 90),
          mediaUrl: null,
          moodScore: 5 + (i % 5),
        },
      });
    }

    if (i === 7) {
      await prisma.entry.create({
        data: {
          userId: user.id,
          date,
          type: "video",
          title: "Test clip placeholder",
          durationSeconds: 12,
          mediaUrl: null,
          moodScore: 7,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded test user (verified):\n  Email:    ${TEST_EMAIL}\n  Password: ${TEST_PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
