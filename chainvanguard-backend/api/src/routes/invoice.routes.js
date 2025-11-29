import express from "express";
import invoiceService from "../services/invoice.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// ========================================
// INVOICE ROUTES
// ========================================

/**
 * GET /api/invoices/:invoiceId
 * Get invoice details by ID
 */
router.get("/:invoiceId", authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.userId;

    const invoice = await invoiceService.getInvoiceById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Check authorization (handle both populated and unpopulated userId)
    const fromUserId = invoice.from.userId?._id
      ? invoice.from.userId._id.toString()
      : invoice.from.userId.toString();
    const toUserId = invoice.to.userId?._id
      ? invoice.to.userId._id.toString()
      : invoice.to.userId.toString();

    const isSender = fromUserId === userId;
    const isRecipient = toUserId === userId;

    if (!isSender && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this invoice",
      });
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("❌ Get invoice error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices/:invoiceId/download
 * Download invoice PDF
 */
router.get("/:invoiceId/download", authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.userId;

    const invoice = await invoiceService.getInvoiceById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Check authorization (handle both populated and unpopulated userId)
    const fromUserId = invoice.from.userId?._id
      ? invoice.from.userId._id.toString()
      : invoice.from.userId.toString();
    const toUserId = invoice.to.userId?._id
      ? invoice.to.userId._id.toString()
      : invoice.to.userId.toString();

    const isSender = fromUserId === userId;
    const isRecipient = toUserId === userId;

    if (!isSender && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to download this invoice",
      });
    }

    // Download PDF
    const pdfBuffer = await invoiceService.downloadInvoice(invoiceId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ Download invoice error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices/user/:userId
 * Get all invoices for a user (sent + received)
 */
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Users can only view their own invoices
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view invoices for this user",
      });
    }

    const invoices = await invoiceService.getUserInvoices(userId);

    res.json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("❌ Get user invoices error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices/order/:orderId
 * Get all invoices for an order
 */
router.get("/order/:orderId", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const invoices = await invoiceService.getInvoicesByEntity("order", orderId);

    res.json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("❌ Get order invoices error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices/vendor-request/:requestId
 * Get all invoices for a vendor request
 */
router.get("/vendor-request/:requestId", authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;

    const invoices = await invoiceService.getInvoicesByEntity(
      "vendor_request",
      requestId
    );

    res.json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("❌ Get vendor request invoices error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices/vendor-inventory/:inventoryId
 * Get all invoices for a vendor inventory
 */
router.get("/vendor-inventory/:inventoryId", authenticate, async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const invoices = await invoiceService.getInvoicesByEntity(
      "vendor_inventory",
      inventoryId
    );

    res.json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("❌ Get vendor inventory invoices error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices/ipfs/:ipfsHash
 * Get invoice by IPFS hash
 */
router.get("/ipfs/:ipfsHash", authenticate, async (req, res) => {
  try {
    const { ipfsHash } = req.params;
    const userId = req.user.userId;

    const invoice = await invoiceService.getInvoiceByIpfsHash(ipfsHash);

    // Check authorization (handle both populated and unpopulated userId)
    const fromUserId = invoice.from.userId?._id
      ? invoice.from.userId._id.toString()
      : invoice.from.userId.toString();
    const toUserId = invoice.to.userId?._id
      ? invoice.to.userId._id.toString()
      : invoice.to.userId.toString();

    const isSender = fromUserId === userId;
    const isRecipient = toUserId === userId;

    if (!isSender && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this invoice",
      });
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("❌ Get invoice by IPFS hash error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/invoices/search
 * Search invoices with multiple criteria
 * Body: { invoiceNumber?, type?, status?, paymentStatus?, fromDate?, toDate?, minAmount?, maxAmount? }
 */
router.post("/search", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const searchCriteria = req.body;

    const invoices = await invoiceService.searchInvoices(userId, searchCriteria);

    res.json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("❌ Search invoices error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
