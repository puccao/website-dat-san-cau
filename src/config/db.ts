import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  mongoose.set("bufferCommands", false);

  if (!mongoUri) {
    console.warn(
      "⚠️ [AI Studio] MONGO_URI is not configured — running with in-memory store fallback"
    );
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.warn(
      "⚠️ [AI Studio] MongoDB connection failed — running with in-memory store fallback:",
      error
    );
  }
}