import { Router } from "express";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import { avatarLibrarySchema } from "@luminary/shared";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { badRequest } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { unlinkUploadFile } from "../services/entryMedia.js";
import { toPublicUser } from "../services/userService.js";

const router = Router();
router.use(requireAuth);

const avatarDir = path.join(env.UPLOAD_DIR, "avatars");
fs.mkdirSync(avatarDir, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, or WebP images are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post("/avatar/upload", avatarUpload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw badRequest("File is required");
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw badRequest("User not found");
    if (user.avatarUrl?.startsWith("/uploads/")) unlinkUploadFile(user.avatarUrl);
    const rel = path.relative(env.UPLOAD_DIR, req.file.path).replace(/\\/g, "/");
    const avatarUrl = `/uploads/${rel}`;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl, avatarLibraryId: null },
    });
    res.json({ user: toPublicUser(updated) });
  } catch (err) {
    next(err);
  }
});

router.post("/avatar/library", async (req, res, next) => {
  try {
    const body = avatarLibrarySchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw badRequest("User not found");
    if (user.avatarUrl?.startsWith("/uploads/")) unlinkUploadFile(user.avatarUrl);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarLibraryId: body.avatarLibraryId, avatarUrl: null },
    });
    res.json({ user: toPublicUser(updated) });
  } catch (err) {
    next(err);
  }
});

router.delete("/avatar", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw badRequest("User not found");
    if (user.avatarUrl?.startsWith("/uploads/")) unlinkUploadFile(user.avatarUrl);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: null, avatarLibraryId: null },
    });
    res.json({ user: toPublicUser(updated) });
  } catch (err) {
    next(err);
  }
});

export default router;
