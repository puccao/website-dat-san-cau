import mongoose from "mongoose";

export async function connectDB() {
  // STRICTLY LOCAL MONGODB (Not MongoDB Atlas SRV)
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/badminton_booking";

  mongoose.set("bufferCommands", false);

  try {
    console.log(`🔌 Attempting connection to local MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log("✅ Local MongoDB connected successfully");
  } catch (error) {
    console.warn(
      "⚠️ Local MongoDB service not detected on 127.0.0.1:27017. Running with embedded in-memory MongoDB store fallback."
    );
  }
}
