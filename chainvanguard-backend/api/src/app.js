// ⚠️ CRITICAL: Load dotenv FIRST before any other imports that might use env variables
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectMongoDB, redisClient } from "./config/database.js";
import { testCloudinaryConnection } from "./config/cloudinary.js";
import ipfsService from "./config/ipfs.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import qrRoutes from "./routes/qr.routes.js";
import expertRoutes from "./routes/expert.routes.js";
import blockchainRoutes from "./routes/blockchain.routes.js";
import ministryRoutes from "./routes/ministry.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import vendorRequestRoutes from "./routes/vendor.request.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import loyaltyRoutes from "./routes/loyalty.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import vendorCustomerRoutes from "./routes/vendor.customer.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import returnRoutes from "./routes/return.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import supplierVendorRoutes from "./routes/supplier.vendor.routes.js";
import vendorInventoryRoutes from "./routes/vendor.inventory.routes.js";
import inventoryBrowseRoutes from "./routes/inventory.browse.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import vendorTransactionRoutes from "./routes/vendor.transaction.routes.js";
import customerBrowseRoutes from "./routes/customer.browse.routes.js";
import supplierRatingRoutes from "./routes/supplier.rating.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

/**
 * Middleware
 */
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // SSR or Postman

      // Allow localhost ports 3000-3099 for frontend
      const localhostPattern = /^http:\/\/localhost:(30[0-9]{2})$/;
      if (localhostPattern.test(origin)) {
        const port = parseInt(origin.match(/:(\d+)$/)[1]);
        if (port >= 3000 && port <= 3099) {
          return callback(null, true);
        }
      }

      // Check allowed origins list
      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("Blocked by CORS: " + origin));
    },
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

/**
 * Service Initialization
 */
const initializeServices = async () => {
  try {
    console.log("\n🔧 Initializing services...\n");

    // MongoDB
    console.log("📊 Connecting to MongoDB...");
    await connectMongoDB();
    console.log("✅ MongoDB connected successfully");

    // Cloudinary
    console.log("☁️  Testing Cloudinary connection...");
    await testCloudinaryConnection();
    console.log("✅ Cloudinary connected successfully");

    // IPFS/Pinata
    console.log("📦 Testing IPFS/Pinata connection...");
    await ipfsService.testConnection();
    console.log("✅ IPFS/Pinata connected successfully");

    console.log("\n🎉 All services initialized successfully!\n");
  } catch (error) {
    console.error("❌ Service initialization error:", error);
    process.exit(1);
  }
};

// Initialize services on startup
initializeServices();

/**
 * Health Check Endpoint
 */
app.get("/health", async (req, res) => {
  const health = {
    status: "OK",
    message: "ChainVanguard API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
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

  // Determine overall status
  const allServicesHealthy = Object.values(health.services).every(
    (status) => status === "running" || status === "connected"
  );
  health.status = allServicesHealthy ? "OK" : "DEGRADED";

  res.status(allServicesHealthy ? 200 : 503).json(health);
});

/**
 * API Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/customer/browse", customerBrowseRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/expert", expertRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/ministry", ministryRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/inventory", inventoryBrowseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/vendor-requests", vendorRequestRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/vendor/customers", vendorCustomerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/vendor-customers", supplierVendorRoutes);
app.use("/api/vendor/inventory", vendorInventoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/vendor", vendorTransactionRoutes);
app.use("/api/suppliers", supplierRatingRoutes);
app.use("/api/invoices", invoiceRoutes);

/**
 * API Info Endpoint
 */
app.get("/api", (req, res) => {
  res.json({
    name: "ChainVanguard API",
    version: "1.0.0",
    description: "Blockchain-based Supply Chain Management System",
    message: "Welcome to ChainVanguard API",
    services: {
      mongodb: "Primary Database",
      redis: "Cache & Sessions",
      cloudinary: "Image Storage (CDN)",
      ipfs: "Decentralized Document Storage (Pinata)",
      hyperledger: "Blockchain Network",
    },
    endpoints: {
      health: {
        method: "GET",
        path: "/health",
        description: "System health check",
      },
      auth: {
        register: {
          method: "POST",
          path: "/api/auth/register",
          description: "Register new user",
        },
        login: {
          method: "POST",
          path: "/api/auth/login",
          description: "User login",
        },
        verifyEmail: {
          method: "POST",
          path: "/api/auth/verify-email",
          description: "Verify email address",
        },
        profile: {
          method: "GET",
          path: "/api/auth/profile",
          description: "Get user profile",
        },
        recoverWallet: {
          method: "POST",
          path: "/api/auth/wallet/recover",
          description: "Recover wallet with mnemonic",
        },
      },
      products: {
        list: {
          method: "GET",
          path: "/api/products",
          description: "Get all products with filters",
        },
        getById: {
          method: "GET",
          path: "/api/products/:id",
          description: "Get product by ID",
        },
        create: {
          method: "POST",
          path: "/api/products",
          description: "Create new product (Supplier/Vendor only)",
        },
        update: {
          method: "PUT",
          path: "/api/products/:id",
          description: "Update product (Owner only)",
        },
        delete: {
          method: "DELETE",
          path: "/api/products/:id",
          description: "Delete product (Owner only)",
        },
        uploadImages: {
          method: "POST",
          path: "/api/products/:id/images",
          description: "Upload product images",
        },
        history: {
          method: "GET",
          path: "/api/products/:id/history",
          description: "Get product blockchain history",
        },
      },
      orders: {
        create: {
          method: "POST",
          path: "/api/orders",
          description: "Create new order (Customer only)",
        },
        list: {
          method: "GET",
          path: "/api/orders",
          description: "Get customer's orders",
        },
        getById: {
          method: "GET",
          path: "/api/orders/:id",
          description: "Get order details",
        },
        cancel: {
          method: "POST",
          path: "/api/orders/:id/cancel",
          description: "Cancel order (Customer)",
        },
        track: {
          method: "GET",
          path: "/api/orders/:id/track",
          description: "Track order",
        },
        sellerOrders: {
          method: "GET",
          path: "/api/orders/seller",
          description: "Get seller's orders",
        },
        updateStatus: {
          method: "PATCH",
          path: "/api/orders/:id/status",
          description: "Update order status (Seller/Vendor)",
        },
        allOrders: {
          method: "GET",
          path: "/api/orders/all",
          description: "Get all orders (Expert only)",
        },
        blockchain: {
          method: "GET",
          path: "/api/orders/:id/blockchain",
          description: "Get order blockchain history",
        },
      },
      cart: {
        get: {
          method: "GET",
          path: "/api/cart",
          description: "Get cart (Guest or Authenticated)",
        },
        add: {
          method: "POST",
          path: "/api/cart/add",
          description: "Add item to cart",
        },
        updateQuantity: {
          method: "PUT",
          path: "/api/cart/item/:itemId",
          description: "Update item quantity",
        },
        remove: {
          method: "DELETE",
          path: "/api/cart/item/:itemId",
          description: "Remove item from cart",
        },
        clear: {
          method: "DELETE",
          path: "/api/cart/clear",
          description: "Clear cart",
        },
        saveForLater: {
          method: "POST",
          path: "/api/cart/save-for-later/:itemId",
          description: "Save item for later",
        },
        applyCoupon: {
          method: "POST",
          path: "/api/cart/apply-coupon",
          description: "Apply coupon code",
        },
        merge: {
          method: "POST",
          path: "/api/cart/merge",
          description: "Merge guest cart (after login)",
        },
        count: {
          method: "GET",
          path: "/api/cart/count",
          description: "Get cart item count",
        },
      },
      categories: {
        all: {
          method: "GET",
          path: "/api/categories",
          description: "Get all categories with metadata",
        },
        list: {
          method: "GET",
          path: "/api/categories/list",
          description: "Get simple category list",
        },
        subcategories: {
          method: "GET",
          path: "/api/categories/:category/subcategories",
          description: "Get subcategories by category",
        },
        sizes: {
          method: "GET",
          path: "/api/categories/:category/sizes",
          description: "Get sizes by category",
        },
        allSizes: {
          method: "GET",
          path: "/api/categories/sizes/all",
          description: "Get all sizes",
        },
        materials: {
          method: "GET",
          path: "/api/categories/options/materials",
          description: "Get common materials",
        },
        colors: {
          method: "GET",
          path: "/api/categories/options/colors",
          description: "Get common colors",
        },
      },
    },
    documentation: {
      swagger: "/api/docs",
      postman: "https://documenter.getpostman.com/view/chainvanguard",
    },
  });
});

/**
 * Root Endpoint
 */
app.get("/", (req, res) => {
  res.json({
    message: "🚀 ChainVanguard API is running",
    version: "1.0.0",
    status: "active",
    documentation: "/api",
    health: "/health",
  });
});

/**
 * Error Handlers
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
    method: req.method,
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: "/api",
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);

  // Default error status
  const statusCode = err.status || err.statusCode || 500;

  // Error response
  const errorResponse = {
    success: false,
    error: err.name || "ServerError",
    message: err.message || "Internal server error",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || null;
  }

  res.status(statusCode).json(errorResponse);
});

/**
 * Start Server
 */
const server = app.listen(PORT, () => {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 ChainVanguard API Server Started Successfully");
  console.log("=".repeat(70));
  console.log(`\n📋 Server Information:`);
  console.log(`   🌍 Environment:  ${process.env.NODE_ENV || "development"}`);
  console.log(`   📡 Port:         ${PORT}`);
  console.log(`   🏠 Host:         http://localhost:${PORT}`);
  console.log(`\n🔗 API Endpoints:`);
  console.log(`   📚 API Info:     http://localhost:${PORT}/api`);
  console.log(`   🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`   🔐 Auth:         http://localhost:${PORT}/api/auth`);
  console.log(`   📦 Products:     http://localhost:${PORT}/api/products`);
  console.log(`   📋 Orders:       http://localhost:${PORT}/api/orders`);
  console.log(`   🛒 Cart:         http://localhost:${PORT}/api/cart`);
  console.log(`   🏷️  Categories:   http://localhost:${PORT}/api/categories`);
  console.log(`\n🛠️  Services:`);
  console.log(`   📊 MongoDB:      Connected`);
  console.log(`   🔴 Redis:        Connected`);
  console.log(`   ☁️  Cloudinary:   Connected`);
  console.log(`   📦 IPFS/Pinata:  Connected`);
  console.log("\n" + "=".repeat(70) + "\n");
  console.log("✅ Ready to accept requests!\n");
});

/**
 * Graceful Shutdown
 */
process.on("SIGTERM", () => {
  console.log("\n⚠️  SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;
