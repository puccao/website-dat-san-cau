import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import locationRoutes from "./routes/location.routes.js";
import bookingRoutes from "./routes/booking.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/info", (_req, res) => {
  res.json({
    success: true,
    name: "Website Đặt Sân Cầu Lông API",
    version: "1.0.0",
  });
});

// Route-level fallback error middleware for database queries
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    err?.name === "MongooseError" ||
    err?.name === "MongoNetworkError" ||
    err?.message?.includes("buffering timed out") ||
    err?.message?.includes("before connection is established")
  ) {
    console.warn("[AI Studio] Database offline — returning mock empty response");
    if (req.method === "GET") {
      return res.json(req.path.endsWith("s") || req.path.endsWith("s/") ? [] : {});
    }
    return res.status(503).json({ error: "Service temporarily unavailable (database offline)" });
  }
  next(err);
});

async function startServer() {
  await connectDB();

  const distClientPath = path.resolve(process.cwd(), "dist/client");
  if (process.env.NODE_ENV === "production" && fs.existsSync(distClientPath)) {
    app.use(express.static(distClientPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distClientPath, "index.html"));
    });
    console.log("📦 Serving production static assets from dist/client");
  } else {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("⚡ Vite dev middleware initialized for Badminton UI");
    } catch (e) {
      console.error("⚠️ Vite middleware error:", e);
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `🚀 Badminton Booking Platform running at http://0.0.0.0:${PORT}`
    );
  });
}

startServer();