import bcrypt from "bcrypt";
import { Router } from "express";
import {
  settingsColorThemeSchema,
  settingsPatchSchema,
  type UserSettings,
} from "@luminary/shared";
import { prisma } from "../db.js";
import { badRequest, unauthorized } from "../lib/errors.js";
import { clearAuthCookies } from "../lib/cookies.js";
import { requireAuth } from "../middleware/auth.js";
import { parseUserSettings, toPublicUser } from "../services/userService.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw unauthorized();
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.patch("/theme", async (req, res, next) => {
  try {
    const body = settingsColorThemeSchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: req.userId! },
      data: { theme: body.theme },
    });
    res.json({ user: toPublicUser(updated) });
  } catch (err) {
    next(err);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const body = settingsPatchSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw unauthorized();

    const currentSettings = parseUserSettings(user.settings);
    const { displayName, ...settingsPatch } = body;
    const nextSettings: UserSettings = { ...currentSettings, ...settingsPatch };

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: displayName?.trim() || user.displayName,
        settings: JSON.stringify(nextSettings),
      },
    });
    res.json({ user: toPublicUser(updated) });
  } catch (err) {
    next(err);
  }
});

router.delete("/account", async (req, res, next) => {
  try {
    const { password } = req.body as { password?: string };
    if (!password) throw badRequest("Password is required to delete account");
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw unauthorized();
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw badRequest("Password is incorrect");
    await prisma.user.delete({ where: { id: user.id } });
    clearAuthCookies(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
