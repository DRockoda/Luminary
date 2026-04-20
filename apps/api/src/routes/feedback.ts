import { Router } from "express";
import { z } from "zod";
import { emailSchema } from "@luminary/shared";
import { prisma } from "../db.js";
import { authRateLimit } from "../middleware/rateLimit.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

const feedbackSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: emailSchema.optional(),
  title: z.string().trim().min(1).max(100).optional(),
  message: z.string().trim().min(2).max(4000),
  priority: z.string().trim().optional(),
  type: z.string().trim().optional(),
});

const VALID_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);
const VALID_TYPES = new Set(["feedback", "bug", "feature", "question"]);

router.post("/", authRateLimit, optionalAuth, async (req, res, next) => {
  try {
    const body = feedbackSchema.parse(req.body);
    const title = body.title?.trim() || body.message.trim().slice(0, 100);
    const message = body.message.trim();
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!req.userId && !body.email?.trim()) {
      return res.status(400).json({ error: "Email is required for anonymous feedback" });
    }

    const normalizedPriority = VALID_PRIORITIES.has(body.priority ?? "")
      ? (body.priority as "low" | "normal" | "high" | "urgent")
      : "normal";
    const normalizedType = VALID_TYPES.has(body.type ?? "")
      ? (body.type as "feedback" | "bug" | "feature" | "question")
      : "feedback";

    await prisma.feedback.create({
      data: {
        userId: req.userId ?? null,
        name: body.name?.trim() || null,
        email: body.email?.trim() || null,
        title,
        message,
        priority: normalizedPriority,
        type: normalizedType,
      },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
