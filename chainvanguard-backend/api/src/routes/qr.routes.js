import express from "express";
import qrService from "../services/qr.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/qr/product/:productId/generate
 * Generate QR code for a product
 * Access: Private (Vendor, Supplier)
 */
router.post(
  "/product/:productId/generate",
  authenticate,
  authorizeRoles("vendor", "supplier"),
  async (req, res) => {
    try {
      const { productId } = req.params;
      const userId = req.userId;

      const result = await qrService.generateProductQR(productId, userId);

      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Generate product QR failed:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate QR code",
      });
    }
  }
);

/**
 * POST /api/qr/order/:orderId/generate
 * Generate QR code for an order
 * Access: Private (Vendor, Supplier)
 */
router.post(
  "/order/:orderId/generate",
  authenticate,
  authorizeRoles("vendor", "supplier"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.userId;

      const result = await qrService.generateOrderQR(orderId, userId);

      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Generate order QR failed:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate order QR code",
      });
    }
  }
);

/**
 * POST /api/qr/scan
 * Scan QR code
 * Access: Public
 */
router.post("/scan", async (req, res) => {
  try {
    const { qrCode, location, device } = req.body;
    const scannedBy = req.userId || null;
    const ipAddress = req.ip;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: "QR code is required",
      });
    }

    const result = await qrService.scanQRCode(
      qrCode,
      scannedBy,
      location,
      device,
      ipAddress
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ QR scan failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to scan QR code",
    });
  }
});

/**
 * GET /api/qr/verify/:qrCode
 * Verify QR code authenticity
 * Access: Public
 */
router.get("/verify/:qrCode", async (req, res) => {
  try {
    const { qrCode } = req.params;

    const result = await qrService.verifyQRAuthenticity(qrCode);

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ QR verification failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify QR code",
    });
  }
});

/**
 * GET /api/qr/track/:qrCode
 * Track product via QR code
 * Access: Public
 */
router.get("/track/:qrCode", async (req, res) => {
  try {
    const { qrCode } = req.params;

    const result = await qrService.trackProduct(qrCode);

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Product tracking failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to track product",
    });
  }
});

/**
 * GET /api/qr/:qrCode/image
 * Get QR code image
 * Access: Public
 */
router.get("/:qrCode/image", async (req, res) => {
  try {
    const { qrCode } = req.params;

    const result = await qrService.getQRImage(qrCode);

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get QR image failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get QR image",
    });
  }
});

export default router;
