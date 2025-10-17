import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectMongoDB, redisClient } from "./config/database.js";
import { testCloudinaryConnection } from "./config/cloudinary.js";
import ipfsService from "./config/ipfs.js";
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize all services
const initializeServices = async () => {
  try {
    console.log("\n🔧 Initializing services...\n");

    // MongoDB
    await connectMongoDB();

    // Cloudinary
    await testCloudinaryConnection();

    // IPFS/Pinata
    await ipfsService.testConnection();

    console.log("\n🎉 All services initialized successfully!\n");
  } catch (error) {
    console.error("❌ Service initialization error:", error);
    process.exit(1);
  }
};

// Initialize services
initializeServices();

// Health check with full system status
app.get("/health", async (req, res) => {
  const health = {
    status: "OK",
    message: "ChainVanguard API is running",
    timestamp: new Date().toISOString(),
    services: {
      api: "running",
      mongodb: "unknown",
      redis: "unknown",
      cloudinary: "unknown",
      ipfs: "unknown",
    },
  };

  // Check MongoDB
  try {
    const mongoose = (await import("mongoose")).default;
    health.services.mongodb =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  } catch (error) {
    health.services.mongodb = "error";
  }

  // Check Redis
  try {
    const pong = await redisClient.ping();
    health.services.redis = pong === "PONG" ? "connected" : "disconnected";
  } catch (error) {
    health.services.redis = "error";
  }

  // Check Cloudinary
  try {
    const cloudinaryStatus = await testCloudinaryConnection();
    health.services.cloudinary = cloudinaryStatus
      ? "connected"
      : "disconnected";
  } catch (error) {
    health.services.cloudinary = "error";
  }

  // Check IPFS
  try {
    const ipfsStatus = await ipfsService.testConnection();
    health.services.ipfs = ipfsStatus.success ? "connected" : "disconnected";
  } catch (error) {
    health.services.ipfs = "error";
  }

  res.status(200).json(health);
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to ChainVanguard API",
    version: "1.0.0",
    services: {
      mongodb: "Primary Database",
      redis: "Cache & Sessions",
      cloudinary: "Image Storage",
      ipfs: "Document Storage",
      hyperledger: "Blockchain",
    },
    endpoints: {
      health: "GET /health",
      // Auth endpoints
      register: "POST /api/auth/register",
      login: "POST /api/auth/login/password",
      verifyEmail: "POST /api/auth/verify-email",
      createWallet: "POST /api/auth/wallet/create",
      recoverWallet: "POST /api/auth/wallet/recover",
      profile: "GET /api/auth/profile",
      // Product endpoints
      products: "GET /api/products",
      productById: "GET /api/products/:id",
      createProduct: "POST /api/products",
      updateProduct: "PUT /api/products/:id",
      deleteProduct: "DELETE /api/products/:id",
      productHistory: "GET /api/products/:id/history",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 ChainVanguard API Server Started`);
  console.log(`${"=".repeat(60)}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`📚 API Info: http://localhost:${PORT}/api`);
  console.log(`${"=".repeat(60)}\n`);
});

export default app;
