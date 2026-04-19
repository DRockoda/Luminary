import { Router } from "express";

const router = Router();

router.get("/random", async (_req, res) => {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    if (!response.ok) {
      res.status(502).json({ error: "Upstream quote service unavailable" });
      return;
    }
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data) || !data[0] || typeof data[0] !== "object") {
      res.status(502).json({ error: "Invalid quote response" });
      return;
    }
    const first = data[0] as { q?: string; a?: string };
    const q = typeof first.q === "string" ? first.q : "";
    const a = typeof first.a === "string" ? first.a : "";
    if (!q) {
      res.status(502).json({ error: "Invalid quote response" });
      return;
    }
    res.json({ q, a: a || "Unknown" });
  } catch {
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});

export default router;
