import express from "express";
import FabricService from "../services/fabric.service.js";

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  const fabricService = new FabricService();
  try {
    await fabricService.connect();
    const products = await fabricService.getAllProducts();
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error("GET /products error:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    fabricService.disconnect();
  }
});

// GET single product by ID
router.get("/:id", async (req, res) => {
  const fabricService = new FabricService();
  try {
    await fabricService.connect();
    const product = await fabricService.getProduct(req.params.id);
    res.json({ success: true, product });
  } catch (error) {
    console.error("GET /products/:id error:", error);

    // Check if product doesn't exist
    if (error.message.includes("does not exist")) {
      return res.status(404).json({
        success: false,
        error: `Product ${req.params.id} not found`,
      });
    }

    res.status(500).json({ success: false, error: error.message });
  } finally {
    fabricService.disconnect();
  }
});

// POST create new product
router.post("/", async (req, res) => {
  const fabricService = new FabricService();
  try {
    await fabricService.connect();
    const product = await fabricService.createProduct(req.body);
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("POST /products error:", error);

    // Check if product already exists
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        error: `Product ${req.body.id} already exists`,
      });
    }

    res.status(500).json({ success: false, error: error.message });
  } finally {
    fabricService.disconnect();
  }
});

// PUT update product
router.put("/:id", async (req, res) => {
  const fabricService = new FabricService();
  try {
    await fabricService.connect();

    const { quantity, status } = req.body;

    // Validate input
    if (quantity === undefined && status === undefined) {
      return res.status(400).json({
        success: false,
        error: "Please provide quantity or status to update",
      });
    }

    const product = await fabricService.updateProduct(
      req.params.id,
      quantity,
      status
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("PUT /products/:id error:", error);

    // Check if product doesn't exist
    if (error.message.includes("does not exist")) {
      return res.status(404).json({
        success: false,
        error: `Product ${req.params.id} not found`,
      });
    }

    res.status(500).json({ success: false, error: error.message });
  } finally {
    fabricService.disconnect();
  }
});

// DELETE product (soft delete by setting status to inactive)
router.delete("/:id", async (req, res) => {
  const fabricService = new FabricService();
  try {
    await fabricService.connect();

    // Get current product to get its quantity
    const currentProduct = await fabricService.getProduct(req.params.id);

    // Soft delete by setting status to inactive
    const product = await fabricService.updateProduct(
      req.params.id,
      currentProduct.quantity,
      "inactive"
    );

    res.json({
      success: true,
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    console.error("DELETE /products/:id error:", error);

    // Check if product doesn't exist
    if (error.message.includes("does not exist")) {
      return res.status(404).json({
        success: false,
        error: `Product ${req.params.id} not found`,
      });
    }

    res.status(500).json({ success: false, error: error.message });
  } finally {
    fabricService.disconnect();
  }
});

// GET product history (blockchain audit trail)
router.get("/:id/history", async (req, res) => {
  const fabricService = new FabricService();
  try {
    await fabricService.connect();
    const history = await fabricService.getProductHistory(req.params.id);

    res.json({
      success: true,
      productId: req.params.id,
      history,
    });
  } catch (error) {
    console.error("GET /products/:id/history error:", error);

    // Check if product doesn't exist
    if (error.message.includes("does not exist")) {
      return res.status(404).json({
        success: false,
        error: `Product ${req.params.id} not found`,
      });
    }

    res.status(500).json({ success: false, error: error.message });
  } finally {
    fabricService.disconnect();
  }
});

export default router;
