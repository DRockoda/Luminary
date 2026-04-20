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
  title: z.string().trim().min(1).max(120).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  type: z.enum(["feedback", "bug", "feature", "question", "other"]).optional(),
  message: z.string().trim().min(2).max(4000),
});

router.post("/", authRateLimit, optionalAuth, async (req, res, next) => {
  try {
    const body = feedbackSchema.parse(req.body);
    const title = body.title?.trim();
    if (!title) {
      return res.status(400).json({ error: "Title is required", code: "MISSING_TITLE" });
    }

    const message = body.message.trim();
    if (!message) {
      return res.status(400).json({ error: "Message is required", code: "MISSING_MESSAGE" });
    }
    if (message.length > 3000) {
      return res.status(400).json({ error: "Message too long (max 3000 chars)" });
    }

    // If authenticated, link feedback to the account identity snapshot.
    let name = body.name?.trim() || null;
    let email = body.email?.trim() || null;
    if (req.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { displayName: true, email: true },
      });
      if (user) {
        name = user.displayName;
        email = user.email;
      }
    }
    if (!email) {
      return res.status(400).json({ error: "Email is required for anonymous feedback" });
    }

    await prisma.feedback.create({
      data: {
        name,
        email,
        title,
        priority: body.priority ?? "normal",
        type: body.type ?? "feedback",
        status: "open",
        message,
      },
    });
    res.status(201).json({ success: true, message: "Feedback submitted successfully." });
  } catch (err) {
    next(err);
  }
});

export default router;
