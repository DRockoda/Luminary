import { Router } from "express";
import { z } from "zod";
import { emailSchema } from "@luminary/shared";
import { prisma } from "../db.js";
import { authRateLimit } from "../middleware/rateLimit.js";

const router = Router();

const feedbackSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: emailSchema,
  message: z.string().trim().min(2).max(4000),
});

router.post("/", authRateLimit, async (req, res, next) => {
  try {
    const body = feedbackSchema.parse(req.body);
    await prisma.feedback.create({
      data: {
        name: body.name?.trim() || null,
        email: body.email,
        message: body.message.trim(),
      },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
