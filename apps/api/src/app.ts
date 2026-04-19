import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { env } from "./env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import adminRouter from "./routes/admin.js";
import announcementsRouter from "./routes/announcements.js";
import authRouter from "./routes/auth.js";
import driveRouter from "./routes/drive.js";
import entriesRouter from "./routes/entries.js";
import exportRouter from "./routes/export.js";
import feedbackRouter from "./routes/feedback.js";
import moodRouter from "./routes/mood.js";
import quotesRouter from "./routes/quotes.js";
import settingsRouter from "./routes/settings.js";
import statsRouter from "./routes/stats.js";
import trashRouter from "./routes/trash.js";
import userRouter from "./routes/user.js";
import warningsRouter from "./routes/warnings.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: (() => {
      const origins = env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
      return origins.length ? origins : ["http://localhost:5173"];
    })(),
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Upload dir is created in `env.ts` (`resolveUploadDir`) so route modules never mkdir before it exists.
app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "luminary-api", uptime: process.uptime() });
});

app.use("/api/quotes", quotesRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/announcements", announcementsRouter);

app.use("/api/auth", authRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/mood", moodRouter);
app.use("/api/stats", statsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/drive", driveRouter);
app.use("/api/export", exportRouter);
app.use("/api/trash", trashRouter);
app.use("/api/user", userRouter);
app.use("/api/warnings", warningsRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
