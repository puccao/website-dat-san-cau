import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import locationRoutes from "./routes/location.routes.js";
import bookingRoutes from "./routes/booking.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.use(
  "/api/locations",
  locationRoutes
);


app.use(
  "/api/bookings",
  bookingRoutes
);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Badminton Booking API is running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API healthy",
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `🚀 Backend running at http://localhost:${PORT}`
    );
  });
}

startServer();