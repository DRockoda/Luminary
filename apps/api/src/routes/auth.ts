import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import {
  changePasswordSchema,
  emailSchema,
  loginSchema,
  passwordSchema,
  signupSchema,
} from "@luminary/shared";
import { prisma } from "../db.js";
import {
  COOKIE_NAMES,
  clearAuthCookies,
  setAccessCookie,
  setRefreshCookie,
} from "../lib/cookies.js";
import { generateSalt, hashToken } from "../lib/crypto.js";
import { DEFAULT_SETTINGS } from "../lib/defaults.js";
import { badRequest, conflict, tooMany, unauthorized } from "../lib/errors.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rateLimit.js";
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../services/email.js";
import { toPublicUser } from "../services/userService.js";

const router = Router();

const VERIFY_TTL_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const RESEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_RESENDS_PER_HOUR = 5;

function newOtp(): string {
  // 6-digit numeric, zero-padded
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

async function issueTokens(
  userId: string,
  rememberMe: boolean,
  res: import("express").Response,
): Promise<{ accessToken: string; refreshToken: string }> {
  const jti = crypto.randomUUID();
  const access = signAccessToken(userId);
  const refreshJwt = signRefreshToken(userId, jti);
  const tokenHash = hashToken(refreshJwt);
  const ttlDays = 30;
  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
    },
  });
  setAccessCookie(res, access);
  setRefreshCookie(res, refreshJwt, rememberMe);
  return { accessToken: access, refreshToken: refreshJwt };
}

function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/signup", authRateLimit, async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw conflict("An account with that email already exists");
    const passwordHash = await bcrypt.hash(body.password, 12);
    const code = newOtp();
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        displayName: body.displayName?.trim() || body.email.split("@")[0],
        encryptionSalt: generateSalt(16),
        settings: JSON.stringify(DEFAULT_SETTINGS),
        emailVerified: false,
        emailVerifyToken: code,
        emailVerifyExpires: new Date(Date.now() + VERIFY_TTL_MS),
        emailLastSentAt: new Date(),
        emailSendCount: 1,
      },
    });
    // No auth cookies issued — user must verify the code first.
    sendVerificationEmail(user.email, user.displayName, code).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[auth/signup] email send failed", err);
    });
    res.status(201).json({
      requiresVerification: true,
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw unauthorized("Invalid email or password");
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw unauthorized("Invalid email or password");
    if (!user.emailVerified) {
      // Reissue a fresh OTP, return 403 so the client routes to the verify screen.
      const code = newOtp();
      const lastSent = user.emailLastSentAt?.getTime() ?? 0;
      const inWindow = Date.now() - lastSent < RESEND_WINDOW_MS;
      const count = inWindow ? user.emailSendCount : 0;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerifyToken: code,
          emailVerifyExpires: new Date(Date.now() + VERIFY_TTL_MS),
          emailLastSentAt: new Date(),
          emailSendCount: count + 1,
        },
      });
      sendVerificationEmail(user.email, user.displayName, code).catch(() => undefined);
      res.status(403).json({
        error: "Email verification required",
        requiresVerification: true,
        email: user.email,
      });
      return;
    }
    const tokens = await issueTokens(user.id, body.rememberMe ?? true, res);
    res.json({ user: toPublicUser(user), ...tokens });
  } catch (err) {
    next(err);
  }
});

const optionalRefreshBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

router.post("/logout", async (req, res, next) => {
  try {
    const body = optionalRefreshBodySchema.parse(req.body ?? {});
    const refresh =
      (req.cookies as Record<string, string> | undefined)?.[COOKIE_NAMES.REFRESH] ??
      body.refreshToken;
    if (refresh) {
      try {
        const payload = verifyRefreshToken(refresh);
        await prisma.refreshToken.updateMany({
          where: { id: payload.jti },
          data: { revokedAt: new Date() },
        });
      } catch {
        // ignore invalid refresh on logout
      }
    }
    clearAuthCookies(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const body = optionalRefreshBodySchema.parse(req.body ?? {});
    const refresh =
      (req.cookies as Record<string, string> | undefined)?.[COOKIE_NAMES.REFRESH] ??
      body.refreshToken;
    if (!refresh) throw unauthorized("No refresh token");
    const payload = verifyRefreshToken(refresh);
    const tokenHash = hashToken(refresh);
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw unauthorized("Refresh token is no longer valid");
    }
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await issueTokens(payload.sub, true, res);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw unauthorized();
    res.json({ user: toPublicUser(user), ...tokens });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw unauthorized();
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw unauthorized();
    const ok = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!ok) throw badRequest("Current password is incorrect");
    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    sendPasswordChangedEmail(user.email, user.displayName).catch(() => undefined);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────── Email verification (OTP) ───────────────

const verifyOtpSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  rememberMe: z.boolean().optional(),
});

router.post("/verify-otp", authRateLimit, async (req, res, next) => {
  try {
    const body = verifyOtpSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw badRequest("Invalid code");
    if (user.emailVerified) {
      // Already verified — just log them in.
      const tokens = await issueTokens(user.id, body.rememberMe ?? true, res);
      res.json({ user: toPublicUser(user), ...tokens });
      return;
    }
    if (
      !user.emailVerifyToken ||
      !user.emailVerifyExpires ||
      user.emailVerifyExpires < new Date()
    ) {
      throw badRequest("This code has expired. Request a new one.");
    }
    if (user.emailVerifyToken !== body.code) {
      throw badRequest("Invalid code");
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });
    const tokens = await issueTokens(updated.id, body.rememberMe ?? true, res);
    res.json({ user: toPublicUser(updated), ...tokens });
  } catch (err) {
    next(err);
  }
});

const resendOtpSchema = z.object({ email: emailSchema });

router.post("/resend-otp", authRateLimit, async (req, res, next) => {
  try {
    const body = resendOtpSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    // Always return ok — never reveal whether the email exists.
    if (!user || user.emailVerified) {
      res.json({ ok: true });
      return;
    }
    const lastSent = user.emailLastSentAt?.getTime() ?? 0;
    const inWindow = Date.now() - lastSent < RESEND_WINDOW_MS;
    const count = inWindow ? user.emailSendCount : 0;
    if (count >= MAX_RESENDS_PER_HOUR) {
      throw tooMany("Too many verification emails sent. Try again later.");
    }
    const code = newOtp();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: code,
        emailVerifyExpires: new Date(Date.now() + VERIFY_TTL_MS),
        emailLastSentAt: new Date(),
        emailSendCount: count + 1,
      },
    });
    await sendVerificationEmail(user.email, user.displayName, code);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────── Forgot / reset password ───────────────

const forgotSchema = z.object({ email: emailSchema });

router.post("/forgot-password", authRateLimit, async (req, res, next) => {
  try {
    const body = forgotSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    // Always return success — don't reveal whether the email exists.
    if (user) {
      const token = newToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });
      sendPasswordResetEmail(user.email, user.displayName, token).catch(() => undefined);
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const resetSchema = z.object({
  token: z.string().min(8),
  newPassword: passwordSchema,
});

router.post("/reset-password", authRateLimit, async (req, res, next) => {
  try {
    const body = resetSchema.parse(req.body);
    const record = await prisma.passwordResetToken.findUnique({
      where: { token: body.token },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw badRequest("This reset link is invalid or expired");
    }
    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    sendPasswordChangedEmail(record.user.email, record.user.displayName).catch(() => undefined);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
