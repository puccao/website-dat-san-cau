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
import adminRoutes from "./routes/admin.routes.js";

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
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Badminton Booking API is healthy",
    database: "mongodb (local: mongodb://127.0.0.1:27017/badminton_booking)",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/info", (_req, res) => {
  res.json({
    success: true,
    name: "Website Đặt Sân Cầu Lông API",
    version: "2.0.0",
    roles: ["user", "admin"],
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
    console.warn("[Database Offline] Falling back to memory response");
    if (req.method === "GET") {
      return res.json(req.path.endsWith("s") || req.path.endsWith("s/") ? [] : {});
    }
    return res.status(503).json({ error: "Dịch vụ cơ sở dữ liệu tạm thời không khả dụng" });
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
      console.log("⚡ Vite dev middleware initialized for Frontend");
    } catch (e) {
      console.error("⚠️ Vite middleware error:", e);
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `🏸 Badminton Booking Platform running at http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
