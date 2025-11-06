import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import orderService from "../services/order.service.js";
import vendorRequestService from "../services/vendor.request.service.js";
import cartService from "../services/cart.service.js";
import logger from "../utils/logger.js";

const router = express.Router();

// ========================================
// UNIFIED CHECKOUT ENDPOINT
// Handles both customer and vendor checkouts
// ========================================

/**
 * POST /api/checkout
 * Unified checkout endpoint for all user roles
 * - Customers: Creates direct order
 * - Vendors: Creates vendor request (requires supplier approval)
 *
 * Body: {
 *   shippingAddress: { name, phone, addressLine1, city, state, country, postalCode },
 *   billingAddress?: { ... },
 *   paymentMethod: 'wallet' | 'card' | 'bank_transfer',
 *   customerNotes?: string,
 *   specialInstructions?: string,
 *   isGift?: boolean,
 *   giftMessage?: string,
 *   discountCode?: string,
 *   urgentOrder?: boolean,
 *   useCart?: boolean  // If true, use items from cart, otherwise use 'items' field
 *   items?: [{ productId, quantity, selectedSize?, selectedColor? }]
 * }
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      shippingAddress,
      billingAddress,
      paymentMethod,
      customerNotes,
      specialInstructions,
      isGift,
      giftMessage,
      discountCode,
      urgentOrder,
      useCart = true,
      items: bodyItems,
    } = req.body;

    const userRole = req.user.role;
    const userId = req.user.userId;

    // ========================================
    // STEP 1: VALIDATION
    // ========================================

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const requiredAddressFields = [
      "name",
      "phone",
      "addressLine1",
      "city",
      "state",
      "country",
      "postalCode",
    ];

    const missingFields = requiredAddressFields.filter(
      (field) => !shippingAddress[field]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required shipping address fields",
        missingFields,
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    // ========================================
    // STEP 2: GET ITEMS (from cart or body)
    // ========================================

    let items = [];

    if (useCart) {
      // Get items from user's cart
      const cart = await cartService.getCart(userId, null);

      if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }

      // Transform cart items to order items format
      items = cart.items.map((item) => ({
        productId: item.productId._id || item.productId,
        quantity: item.quantity,
        price: item.price,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        selectedFit: item.selectedFit,
        sellerId: item.sellerId || item.productId?.vendorId,
        sellerRole: item.sellerRole || "vendor",
      }));
    } else {
      // Use items from request body
      if (!bodyItems || !Array.isArray(bodyItems) || bodyItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Items are required when not using cart",
        });
      }

      items = bodyItems;
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid item structure. Each item must have productId and quantity >= 1",
        });
      }
    }

    // ========================================
    // STEP 3: DETERMINE SELLER TYPES
    // ========================================

    // Group items by seller role (vendor vs supplier)
    const itemsBySellerRole = items.reduce((acc, item) => {
      const sellerRole = item.sellerRole || "vendor";
      if (!acc[sellerRole]) {
        acc[sellerRole] = [];
      }
      acc[sellerRole].push(item);
      return acc;
    }, {});

    // ========================================
    // STEP 4: ROUTE TO APPROPRIATE CHECKOUT
    // ========================================

    const results = [];
    const errors = [];

    // Handle each seller type separately
    for (const [sellerRole, sellerItems] of Object.entries(itemsBySellerRole)) {
      try {
        if (userRole === "customer") {
          // =====================================
          // CUSTOMER CHECKOUT (Direct Orders)
          // =====================================

          if (sellerRole === "vendor") {
            // Customer buying products from vendor
            logger.info(`Customer ${userId} checking out with vendor`);

            const orderResult = await orderService.createOrder(
              {
                items: sellerItems,
                shippingAddress,
                billingAddress: billingAddress || shippingAddress,
                paymentMethod,
                customerNotes,
                specialInstructions,
                isGift,
                giftMessage,
                discountCode,
                urgentOrder,
              },
              userId
            );

            results.push({
              type: "order",
              sellerRole: "vendor",
              result: orderResult,
            });
          } else {
            // Customers shouldn't buy directly from suppliers
            errors.push({
              sellerRole,
              error: "Customers can only buy from vendors",
            });
          }
        } else if (userRole === "vendor") {
          // =====================================
          // VENDOR CHECKOUT
          // =====================================

          if (sellerRole === "supplier") {
            // Vendor buying raw materials from supplier
            // Must use vendor request system (requires approval)
            logger.info(
              `Vendor ${userId} creating purchase request from supplier`
            );

            // Group items by supplier
            const itemsBySupplier = sellerItems.reduce((acc, item) => {
              const supplierId = item.sellerId.toString();
              if (!acc[supplierId]) {
                acc[supplierId] = {
                  supplierId,
                  items: [],
                };
              }
              acc[supplierId].items.push({
                inventoryId: item.productId,
                quantity: item.quantity,
                pricePerUnit: item.price,
              });
              return acc;
            }, {});

            // Create vendor request for each supplier
            for (const supplierGroup of Object.values(itemsBySupplier)) {
              const vendorRequestResult =
                await vendorRequestService.createVendorRequest(
                  {
                    supplierId: supplierGroup.supplierId,
                    items: supplierGroup.items,
                    requestType: "purchase",
                    shippingAddress,
                    billingAddress: billingAddress || shippingAddress,
                    paymentMethod,
                    notes: customerNotes || "",
                    specialInstructions,
                    urgentRequest: urgentOrder,
                  },
                  userId
                );

              results.push({
                type: "vendor_request",
                sellerRole: "supplier",
                supplierId: supplierGroup.supplierId,
                result: vendorRequestResult,
              });
            }
          } else if (sellerRole === "vendor") {
            // Vendor buying finished products from another vendor
            // This would be a direct order (rare case)
            logger.info(`Vendor ${userId} buying from another vendor`);

            const orderResult = await orderService.createOrder(
              {
                items: sellerItems,
                shippingAddress,
                billingAddress: billingAddress || shippingAddress,
                paymentMethod,
                customerNotes,
                specialInstructions,
                isGift,
                giftMessage,
                discountCode,
                urgentOrder,
              },
              userId
            );

            results.push({
              type: "order",
              sellerRole: "vendor",
              result: orderResult,
            });
          }
        } else {
          // Other roles (supplier, expert, etc.)
          errors.push({
            userRole,
            error: "Only customers and vendors can checkout",
          });
        }
      } catch (error) {
        logger.error(`Checkout error for ${sellerRole}:`, error);
        errors.push({
          sellerRole,
          error: error.message,
        });
      }
    }

    // ========================================
    // STEP 5: CLEAR CART (if used)
    // ========================================

    if (useCart && results.length > 0 && errors.length === 0) {
      try {
        await cartService.clearCart(userId, null);
        logger.info(`Cart cleared for user ${userId}`);
      } catch (error) {
        logger.error("Failed to clear cart:", error);
        // Don't fail checkout if cart clear fails
      }
    }

    // ========================================
    // STEP 6: RETURN RESULTS
    // ========================================

    if (errors.length > 0 && results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Checkout failed",
        errors,
      });
    }

    res.status(201).json({
      success: true,
      message: getSuccessMessage(userRole, results),
      data: {
        orders: results.filter((r) => r.type === "order"),
        vendorRequests: results.filter((r) => r.type === "vendor_request"),
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error("Checkout error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes("out of stock") ||
      error.message.includes("insufficient")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Checkout failed",
    });
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

function getSuccessMessage(userRole, results) {
  if (userRole === "customer") {
    const orderCount = results.filter((r) => r.type === "order").length;
    return `Successfully created ${orderCount} order(s)`;
  } else if (userRole === "vendor") {
    const orderCount = results.filter((r) => r.type === "order").length;
    const requestCount = results.filter(
      (r) => r.type === "vendor_request"
    ).length;

    const messages = [];
    if (orderCount > 0) {
      messages.push(`${orderCount} order(s) created`);
    }
    if (requestCount > 0) {
      messages.push(
        `${requestCount} purchase request(s) created (awaiting supplier approval)`
      );
    }

    return `Successfully created ${messages.join(" and ")}`;
  }

  return "Checkout completed successfully";
}

// ========================================
// CHECKOUT VALIDATION ENDPOINT
// ========================================

/**
 * POST /api/checkout/validate
 * Validate checkout data before submission
 * Body: { useCart?, items? }
 */
router.post("/validate", authenticate, async (req, res) => {
  try {
    const { useCart = true, items: bodyItems } = req.body;
    const userId = req.user.userId;

    let items = [];

    if (useCart) {
      const cart = await cartService.getCart(userId, null);

      if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
          valid: false,
        });
      }

      items = cart.items;
    } else {
      if (!bodyItems || !Array.isArray(bodyItems) || bodyItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Items are required",
          valid: false,
        });
      }

      items = bodyItems;
    }

    // Validate cart items
    const validation = await cartService.validateCart(userId, null);

    res.json({
      success: true,
      valid: validation.valid,
      issues: validation.issues || [],
      summary: {
        itemCount: items.length,
        totalAmount: validation.totalAmount,
      },
    });
  } catch (error) {
    logger.error("Checkout validation error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ========================================
// GET CHECKOUT SUMMARY
// ========================================

/**
 * GET /api/checkout/summary
 * Get checkout summary (items, totals, etc.)
 */
router.get("/summary", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await cartService.getCart(userId, null);

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Calculate summary
    const summary = {
      items: cart.items,
      itemCount: cart.items.length,
      subtotal: cart.subtotal || 0,
      tax: cart.tax || 0,
      shipping: cart.shipping || 0,
      discount: cart.discount || 0,
      total: cart.totalAmount || 0,
      appliedCoupon: cart.appliedCoupon,
    };

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    logger.error("Get checkout summary error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
