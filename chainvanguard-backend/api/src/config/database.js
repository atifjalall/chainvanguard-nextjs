import mongoose from "mongoose";
import Redis from "ioredis";

/* MongoDB setup with safe mode fallback */
export const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.warn("⚠️  MongoDB unavailable - Safe Mode will be enabled");
    console.warn("📦 Application will serve data from IPFS backups");
    console.warn("✋ Write operations will be blocked");
    // DON'T crash - let the app start in safe mode
    // process.exit(1); // REMOVED - app continues without MongoDB
  }
};

// Monitor connection state changes
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected - Safe Mode active");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected - Normal mode restored");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err.message);
  console.warn("⚠️  Safe Mode remains active");
});

/* ============================================================
   ⚡ Redis with fallback logic
   ============================================================ */
let redisClient;

const setupLocalRedis = () => {
  const local = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    connectTimeout: 10000,
    retryStrategy: (times) => Math.min(times * 100, 2000),
  });
  console.log("⚙️ Fallback: switching to local Redis (127.0.0.1:6379)");
  local.on("error", (err) =>
    console.error("❌ Local Redis error:", err.message)
  );
  local.on("connect", () => console.log("✅ Local Redis connected"));
  local.on("ready", () => console.log("🚀 Local Redis ready"));
  return local;
};

const initRedis = () => {
  // If in dev and local variables indicate local, skip Upstash
  const useLocalForced =
    process.env.REDIS_USE_LOCAL === "true" ||
    process.env.NODE_ENV === "development";

  if (!useLocalForced && process.env.REDIS_URL) {
    // Try Upstash / Cloud first
    redisClient = new Redis(process.env.REDIS_URL, {
      tls: { rejectUnauthorized: false },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
    console.log("☁️ Attempting Upstash / cloud Redis");

    // If an error happens connecting to cloud, fallback to local
    redisClient.on("error", (err) => {
      console.error("❌ Cloud Redis error:", err.message);
      // only fallback if it's a connection error (timeout, etc.)
      if (
        err.message.includes("connect ETIMEDOUT") ||
        err.message.includes("ECONNREFUSED") ||
        err.message.includes("connection failed")
      ) {
        // clean up the existing client
        try {
          redisClient.disconnect(); // or quit
        } catch (_e) {}
        // replace with local
        redisClient = setupLocalRedis();
      }
    });

    redisClient.on("connect", () => {
      console.log("✅ Cloud Redis connected successfully");
    });
    redisClient.on("ready", () => console.log("🚀 Cloud Redis ready"));
  } else {
    // Directly use local
    redisClient = setupLocalRedis();
  }
};

// Immediately setup Redis
initRedis();

/* Graceful shutdown */
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    await mongoose.connection.close();
    if (redisClient) {
      await redisClient.quit();
    }
  } catch (err) {
    console.error("❌ Shutdown error:", err.message);
  }
  process.exit(0);
});

export { mongoose, redisClient };
