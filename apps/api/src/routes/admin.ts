import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { signAdminToken } from "../lib/adminJwt.js";
import { clearAdminCookie, setAdminCookie } from "../lib/cookies.js";
import { badRequest, notFound, unauthorized } from "../lib/errors.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { authRateLimit } from "../middleware/rateLimit.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

router.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const admin = await prisma.adminUser.findUnique({ where: { username: body.username } });
    if (!admin) throw unauthorized("Invalid username or password");
    const ok = await bcrypt.compare(body.password, admin.passwordHash);
    if (!ok) throw unauthorized("Invalid username or password");
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    const token = signAdminToken(admin.id, admin.username);
    setAdminCookie(res, token);
    res.json({ admin: { id: admin.id, username: admin.username } });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAdmin, async (req, res, next) => {
  try {
    const admin = await prisma.adminUser.findUnique({ where: { id: req.adminId! } });
    if (!admin) throw unauthorized();
    res.json({ admin: { id: admin.id, username: admin.username } });
  } catch (err) {
    next(err);
  }
});

// Everything below requires admin auth
router.use(requireAdmin);

// ─────────────── Stats / Overview ───────────────

router.get("/stats/overview", async (_req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      verifiedUsers,
      totalEntries,
      unresolvedFeedback,
      signupsToday,
      entriesToday,
      activeWeekRows,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.entry.count({ where: { deletedAt: null } }),
      prisma.feedback.count({ where: { status: { in: ["open", "in-progress"] } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.entry.count({
        where: { deletedAt: null, createdAt: { gte: startOfToday } },
      }),
      prisma.entry.findMany({
        where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
        distinct: ["userId"],
        select: { userId: true },
      }),
    ]);
    const pendingUsers = totalUsers - verifiedUsers;
    const activeWeek = activeWeekRows.length;

    // 30-day signups (group by date)
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const byDay = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      byDay.set(toIsoDay(d), 0);
    }
    for (const u of recentUsers) {
      const k = toIsoDay(u.createdAt);
      if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + 1);
    }
    const signups = Array.from(byDay.entries()).map(([date, count]) => ({ date, count }));

    // Recent activity (metadata only — no entry contents)
    const [latestSignups, latestFeedback] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          email: true,
          displayName: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          title: true,
          status: true,
          priority: true,
          type: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      totalUsers,
      verifiedUsers,
      pendingUsers,
      totalEntries,
      unresolvedFeedback,
      signupsToday,
      entriesToday,
      activeWeek,
      signups,
      latestSignups: latestSignups.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt.toISOString(),
      })),
      latestFeedback: latestFeedback.map((f) => ({
        id: f.id,
        name: f.name,
        email: f.email,
        title: f.title,
        status: f.status,
        priority: f.priority,
        type: f.type,
        createdAt: f.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────── Users (metadata only — never content) ───────────────

router.get("/users", async (req, res, next) => {
  try {
    const search = String(req.query.q ?? "").trim();
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { displayName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        displayName: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        driveConnected: true,
      },
    });

    const aggregates = await Promise.all(
      users.map(async (u) => {
        const [byType, sizeAgg] = await Promise.all([
          prisma.entry.groupBy({
            by: ["type"],
            where: { userId: u.id, deletedAt: null },
            _count: { _all: true },
          }),
          prisma.entry.aggregate({
            where: { userId: u.id, deletedAt: null },
            _sum: { fileSizeBytes: true },
          }),
        ]);
        const counts: Record<string, number> = { audio: 0, video: 0, text: 0 };
        for (const row of byType) counts[row.type] = row._count._all;
        const total = (counts.audio ?? 0) + (counts.video ?? 0) + (counts.text ?? 0);
        return {
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          driveConnected: u.driveConnected,
          entryCount: total,
          audioCount: counts.audio ?? 0,
          videoCount: counts.video ?? 0,
          textCount: counts.text ?? 0,
          storageBytes: sizeAgg._sum.fileSizeBytes ?? 0,
        };
      }),
    );

    res.json({ users: aggregates });
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        emailVerified: true,
        createdAt: true,
        avatarUrl: true,
        avatarLibraryId: true,
      },
    });
    if (!user) throw notFound("User not found");

    const [byType, sizeAgg, dates, warnings] = await Promise.all([
      prisma.entry.groupBy({
        by: ["type"],
        where: { userId: user.id, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.entry.aggregate({
        where: { userId: user.id, deletedAt: null },
        _sum: { fileSizeBytes: true },
      }),
      prisma.entry.findMany({
        where: { userId: user.id, deletedAt: null },
        select: { date: true, createdAt: true },
        orderBy: { date: "desc" },
      }),
      prisma.userWarning.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const counts: Record<string, number> = { audio: 0, video: 0, text: 0 };
    for (const row of byType) counts[row.type] = row._count._all;
    const total = (counts.audio ?? 0) + (counts.video ?? 0) + (counts.text ?? 0);
    const currentStreak = computeCurrentStreak(dates.map((d) => d.date));

    // Group by month (last 12)
    const byMonth = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      byMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
    }
    for (const e of dates) {
      const k = e.date.slice(0, 7);
      if (byMonth.has(k)) byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        avatarUrl: user.avatarUrl,
        avatarLibraryId: user.avatarLibraryId,
        entryCount: total,
        audioCount: counts.audio ?? 0,
        videoCount: counts.video ?? 0,
        textCount: counts.text ?? 0,
        storageBytes: sizeAgg._sum.fileSizeBytes ?? 0,
        currentStreak,
        byMonth: Array.from(byMonth.entries()).map(([month, count]) => ({ month, count })),
      },
      warnings: warnings.map((w) => ({
        id: w.id,
        message: w.message,
        level: w.level,
        isDismissed: w.isDismissed,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

const verifyUserSchema = z.object({ emailVerified: z.boolean() });

router.patch("/users/:id/verify", async (req, res, next) => {
  try {
    const body = verifyUserSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw notFound("User not found");
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: body.emailVerified,
        // Wipe any pending OTP when admin toggles state directly.
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });
    res.json({ ok: true, emailVerified: updated.emailVerified });
  } catch (err) {
    next(err);
  }
});

const deleteUserSchema = z.object({ confirmEmail: z.string() });

router.delete("/users/:id", async (req, res, next) => {
  try {
    const body = deleteUserSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw notFound("User not found");
    if (body.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      throw badRequest("Email confirmation does not match");
    }
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────── Warnings ───────────────

const warningSchema = z.object({
  message: z.string().trim().min(2).max(500),
  level: z.enum(["info", "warning", "danger"]),
});

router.post("/users/:id/warnings", async (req, res, next) => {
  try {
    const body = warningSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw notFound("User not found");
    const warning = await prisma.userWarning.create({
      data: {
        userId: user.id,
        message: body.message,
        level: body.level,
        createdBy: req.adminId!,
      },
    });
    res.json({
      warning: {
        id: warning.id,
        message: warning.message,
        level: warning.level,
        isDismissed: warning.isDismissed,
        createdAt: warning.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/warnings/:id", async (req, res, next) => {
  try {
    await prisma.userWarning.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────── Announcements ───────────────

const announcementSchema = z.object({
  message: z.string().trim().min(2).max(500),
  link: z.string().url().or(z.literal("")).optional(),
  linkLabel: z.string().trim().max(80).optional(),
  color: z.enum(["info", "success", "warning", "danger", "accent"]),
  expiresAt: z.string().datetime().or(z.literal("")).optional(),
  isMaintenance: z.boolean().optional(),
});

router.get("/announcements", async (_req, res, next) => {
  try {
    const items = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({
      announcements: items.map((a) => ({
        id: a.id,
        message: a.message,
        link: a.link,
        linkLabel: a.linkLabel,
        color: a.color,
        isActive: a.isActive,
        isMaintenance: a.isMaintenance,
        createdAt: a.createdAt.toISOString(),
        expiresAt: a.expiresAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/announcements", async (req, res, next) => {
  try {
    const body = announcementSchema.parse(req.body);
    // Only one announcement can be active at a time — deactivate others.
    await prisma.announcement.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
    const created = await prisma.announcement.create({
      data: {
        message: body.message,
        link: body.link?.trim() || null,
        linkLabel: body.linkLabel?.trim() || null,
        color: body.color,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdBy: req.adminId!,
        isActive: true,
        isMaintenance: body.isMaintenance ?? false,
      },
    });
    res.json({
      announcement: {
        id: created.id,
        message: created.message,
        link: created.link,
        linkLabel: created.linkLabel,
        color: created.color,
        isActive: created.isActive,
        isMaintenance: created.isMaintenance,
        createdAt: created.createdAt.toISOString(),
        expiresAt: created.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/announcements/deactivate-all", async (_req, res, next) => {
  try {
    await prisma.announcement.updateMany({
      data: { isActive: false },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch("/announcements/disable-maintenance", async (_req, res, next) => {
  try {
    await prisma.announcement.updateMany({
      where: { isMaintenance: true },
      data: { isMaintenance: false, isActive: false },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const patchAnnouncementSchema = z.object({ isActive: z.boolean() });

router.patch("/announcements/:id", async (req, res, next) => {
  try {
    const body = patchAnnouncementSchema.parse(req.body);
    const updated = await prisma.announcement.update({
      where: { id: req.params.id },
      data: { isActive: body.isActive },
    });
    res.json({
      announcement: {
        id: updated.id,
        message: updated.message,
        link: updated.link,
        linkLabel: updated.linkLabel,
        color: updated.color,
        isActive: updated.isActive,
        isMaintenance: updated.isMaintenance,
        createdAt: updated.createdAt.toISOString(),
        expiresAt: updated.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/announcements/:id", async (req, res, next) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────── Feedback ───────────────

router.get("/feedback", async (req, res, next) => {
  try {
    const search = String(req.query.q ?? "").trim().toLowerCase();
    const status = String(req.query.status ?? "").trim();
    const priority = String(req.query.priority ?? "").trim();
    const type = String(req.query.type ?? "").trim();
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
            { title: { contains: search, mode: "insensitive" as const } },
            { message: { contains: search, mode: "insensitive" as const } },
            {
              user: {
                is: {
                  OR: [
                    { email: { contains: search, mode: "insensitive" as const } },
                    { displayName: { contains: search, mode: "insensitive" as const } },
                  ],
                },
              },
            },
          ],
        }
      : {};
    if (status) {
      (where as Record<string, unknown>).status = status;
    }
    if (priority) {
      (where as Record<string, unknown>).priority = priority;
    }
    if (type) {
      (where as Record<string, unknown>).type = type;
    }
    const items = await prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    res.json({
      feedback: items.map((f) => ({
        id: f.id,
        userId: f.userId,
        user: f.user,
        name: f.name,
        email: f.email,
        title: f.title,
        message: f.message,
        priority: f.priority,
        type: f.type,
        status: f.status,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

const patchFeedbackSchema = z.object({
  status: z.enum(["open", "in-progress", "resolved", "closed"]),
});

router.patch("/feedback/:id", async (req, res, next) => {
  try {
    const body = patchFeedbackSchema.parse(req.body);
    const updated = await prisma.feedback.update({
      where: { id: req.params.id },
      data: { status: body.status, updatedAt: new Date() },
    });
    res.json({ ok: true, status: updated.status, updatedAt: updated.updatedAt.toISOString() });
  } catch (err) {
    next(err);
  }
});

router.delete("/feedback/:id", async (req, res, next) => {
  try {
    await prisma.feedback.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────── Helpers ───────────────

function toIsoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeCurrentStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = toIsoDay(cursor);
    if (set.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      // Allow today to be missed, count from yesterday.
      cursor.setDate(cursor.getDate() - 1);
      const y = toIsoDay(cursor);
      if (set.has(y)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
}

export default router;
