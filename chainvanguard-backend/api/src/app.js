import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js"; // ⭐ ADD THIS

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "ChainVanguard API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes); // ⭐ ADD THIS

app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to ChainVanguard API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      products: "GET /api/products",
      productById: "GET /api/products/:id",
      createProduct: "POST /api/products",
      updateProduct: "PUT /api/products/:id",
      deleteProduct: "DELETE /api/products/:id",
      productHistory: "GET /api/products/:id/history",
      createWallet: "POST /api/auth/wallet/create",
      recoverWallet: "POST /api/auth/wallet/recover",
      authChallenge: "POST /api/auth/challenge",
      login: "POST /api/auth/login",
      register: "POST /api/auth/register",
      verify: "POST /api/auth/verify",
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ChainVanguard API running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
});

export default app;
