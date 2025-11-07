import User from "../models/User.js";
import Order from "../models/Order.js";

class LoyaltyService {
  /**
   * Award points to customer after successful order delivery
   * Called when order status = 'delivered'
   * B2C: Customer gets points when buying from vendor
   * Rule: 1 point per $1 spent, 1000 points = 10% discount
   */
  async awardPointsToCustomer(customerId, orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      const customer = await User.findById(customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Award 1 point per dollar spent (rounded down)
      const pointsEarned = Math.floor(order.total);

      customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsEarned;
      customer.totalSpent = (customer.totalSpent || 0) + order.total;

      // Check if customer reached 1000 points for 10% discount
      if (customer.loyaltyPoints >= 1000) {
        customer.discountEligible = true;
      }

      await customer.save();

      console.log(
        `✅ Awarded ${pointsEarned} loyalty points to customer ${customer.name}`
      );

      return {
        success: true,
        pointsEarned,
        totalPoints: customer.loyaltyPoints,
        discountEligible: customer.discountEligible,
        message:
          customer.discountEligible && customer.loyaltyPoints >= 1000
            ? "🎉 Congratulations! You're eligible for 10% discount on your next order!"
            : `${1000 - customer.loyaltyPoints} more points until 10% discount!`,
      };
    } catch (error) {
      console.error("❌ Award points to customer error:", error);
      throw error;
    }
  }

  /**
   * Award points to vendor after successful order (B2B)
   * Called when order status = 'delivered' or 'completed'
   */
  async awardPoints(vendorId, orderId) {
    try {
      const order = await Order.findById(orderId).populate(
        "sellerId",
        "discountSettings"
      );

      if (!order) {
        throw new Error("Order not found");
      }

      const vendor = await User.findById(vendorId);
      if (!vendor || vendor.role !== "vendor") {
        throw new Error("Invalid vendor");
      }

      // Award 1 point per dollar spent
      const pointsEarned = Math.floor(order.totalAmount);

      vendor.loyaltyPoints = (vendor.loyaltyPoints || 0) + pointsEarned;
      vendor.totalSpent = (vendor.totalSpent || 0) + order.totalAmount;

      // Check discount eligibility
      const supplier = order.sellerId;
      if (supplier && supplier.discountSettings?.enabled) {
        if (vendor.loyaltyPoints >= supplier.discountSettings.pointsRequired) {
          vendor.discountEligible = true;
        }
      }

      await vendor.save();

      console.log(`✅ Awarded ${pointsEarned} points to vendor ${vendor.name}`);

      return {
        success: true,
        pointsEarned,
        totalPoints: vendor.loyaltyPoints,
        discountEligible: vendor.discountEligible,
      };
    } catch (error) {
      console.error("❌ Award points error:", error);
      throw error;
    }
  }

  /**
   * Calculate discount for customer based on loyalty points
   * Customer gets 10% discount when they have 1000+ points
   * Points are redeemed after discount is applied
   */
  async calculateCustomerDiscount(customerId, orderAmount) {
    try {
      const customer = await User.findById(customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Check if customer is eligible for discount (1000+ points)
      if (!customer.discountEligible || customer.loyaltyPoints < 1000) {
        return {
          discount: 0,
          finalAmount: orderAmount,
          discountPercentage: 0,
          eligible: false,
          currentPoints: customer.loyaltyPoints || 0,
          pointsNeeded: Math.max(0, 1000 - (customer.loyaltyPoints || 0)),
        };
      }

      const discountPercentage = 10; // 10% discount
      const discount = orderAmount * (discountPercentage / 100);

      return {
        discount,
        finalAmount: orderAmount - discount,
        discountPercentage,
        eligible: true,
        currentPoints: customer.loyaltyPoints,
        pointsToRedeem: 1000, // Will be deducted after order completion
      };
    } catch (error) {
      console.error("❌ Calculate customer discount error:", error);
      throw error;
    }
  }

  /**
   * Redeem loyalty points after discount is applied
   * Called after order with loyalty discount is completed
   */
  async redeemCustomerPoints(customerId, pointsToRedeem = 1000) {
    try {
      const customer = await User.findById(customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      if (customer.loyaltyPoints < pointsToRedeem) {
        throw new Error("Insufficient loyalty points");
      }

      customer.loyaltyPoints -= pointsToRedeem;

      // Check if still eligible for discount
      customer.discountEligible = customer.loyaltyPoints >= 1000;

      await customer.save();

      console.log(
        `✅ Redeemed ${pointsToRedeem} points for customer ${customer.name}`
      );

      return {
        success: true,
        pointsRedeemed: pointsToRedeem,
        remainingPoints: customer.loyaltyPoints,
        stillEligible: customer.discountEligible,
      };
    } catch (error) {
      console.error("❌ Redeem customer points error:", error);
      throw error;
    }
  }

  /**
   * Get customer loyalty status
   */
  async getCustomerLoyaltyStatus(customerId) {
    try {
      const customer = await User.findById(customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      const currentPoints = customer.loyaltyPoints || 0;
      const pointsNeeded = Math.max(0, 1000 - currentPoints);
      const discountEligible = currentPoints >= 1000;

      return {
        success: true,
        loyaltyStatus: {
          currentPoints,
          pointsNeeded,
          discountEligible,
          discountPercentage: discountEligible ? 10 : 0,
          totalSpent: customer.totalSpent || 0,
          message: discountEligible
            ? "🎉 You're eligible for 10% discount!"
            : `Earn ${pointsNeeded} more points for 10% discount!`,
        },
      };
    } catch (error) {
      console.error("❌ Get customer loyalty status error:", error);
      throw error;
    }
  }

  /**
   * Calculate discount for vendor based on loyalty points
   */
  async calculateDiscount(vendorId, supplierId, orderAmount) {
    try {
      const vendor = await User.findById(vendorId);
      const supplier = await User.findById(supplierId);

      if (!vendor || !supplier) {
        throw new Error("Vendor or supplier not found");
      }

      // Check if discount is applicable
      if (!vendor.discountEligible || !supplier.discountSettings?.enabled) {
        return {
          discount: 0,
          finalAmount: orderAmount,
          discountPercentage: 0,
          eligible: false,
        };
      }

      const discountPercentage =
        supplier.discountSettings.discountPercentage || 10;
      const discount = orderAmount * (discountPercentage / 100);

      return {
        discount,
        finalAmount: orderAmount - discount,
        discountPercentage,
        eligible: true,
      };
    } catch (error) {
      console.error("❌ Calculate discount error:", error);
      throw error;
    }
  }

  /**
   * Get vendor loyalty status with specific supplier
   */
  async getVendorLoyaltyStatus(vendorId, supplierId) {
    try {
      const vendor = await User.findById(vendorId);
      const supplier = await User.findById(supplierId);

      if (!vendor) {
        throw new Error("Vendor not found");
      }

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      const pointsRequired = supplier.discountSettings?.pointsRequired || 1000;
      const discountPercentage =
        supplier.discountSettings?.discountPercentage || 10;
      const enabled = supplier.discountSettings?.enabled !== false;

      return {
        success: true,
        loyaltyStatus: {
          currentPoints: vendor.loyaltyPoints || 0,
          pointsRequired,
          discountPercentage,
          discountEligible: vendor.discountEligible || false,
          totalSpent: vendor.totalSpent || 0,
          pointsToNextDiscount: Math.max(
            0,
            pointsRequired - (vendor.loyaltyPoints || 0)
          ),
          supplierDiscountEnabled: enabled,
        },
      };
    } catch (error) {
      console.error("❌ Get loyalty status error:", error);
      throw error;
    }
  }

  /**
   * Supplier: Update discount settings
   */
  async updateDiscountSettings(supplierId, settings) {
    try {
      const supplier = await User.findById(supplierId);

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      if (supplier.role !== "supplier") {
        throw new Error("Only suppliers can update discount settings");
      }

      // Validate settings
      if (
        settings.pointsRequired !== undefined &&
        settings.pointsRequired < 0
      ) {
        throw new Error("Points required must be non-negative");
      }

      if (
        settings.discountPercentage !== undefined &&
        (settings.discountPercentage < 0 || settings.discountPercentage > 100)
      ) {
        throw new Error("Discount percentage must be between 0 and 100");
      }

      supplier.discountSettings = {
        pointsRequired:
          settings.pointsRequired !== undefined
            ? settings.pointsRequired
            : 1000,
        discountPercentage:
          settings.discountPercentage !== undefined
            ? settings.discountPercentage
            : 10,
        enabled: settings.enabled !== undefined ? settings.enabled : true,
      };

      await supplier.save();

      console.log(`✅ Updated discount settings for supplier ${supplier.name}`);

      return {
        success: true,
        message: "Discount settings updated successfully",
        discountSettings: supplier.discountSettings,
      };
    } catch (error) {
      console.error("❌ Update discount settings error:", error);
      throw error;
    }
  }

  /**
   * Supplier: Get vendor points and order details
   */
  async getVendorPointsDetail(supplierId, vendorId) {
    try {
      const vendor = await User.findById(vendorId);

      if (!vendor) {
        throw new Error("Vendor not found");
      }

      // Get all completed orders from this vendor
      const orders = await Order.find({
        buyerId: vendorId,
        sellerId: supplierId,
        status: { $in: ["delivered", "completed"] },
      }).sort({ createdAt: -1 });

      // Calculate totals
      const totalOrders = orders.length;
      const totalSpent = orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );

      return {
        success: true,
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          companyName: vendor.companyName,
          loyaltyPoints: vendor.loyaltyPoints || 0,
          totalSpent: vendor.totalSpent || 0,
          discountEligible: vendor.discountEligible || false,
          totalOrders,
        },
        recentOrders: orders.slice(0, 5).map((order) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          status: order.status,
          date: order.createdAt,
        })),
        statistics: {
          totalOrders,
          totalSpent,
          avgOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
        },
      };
    } catch (error) {
      console.error("❌ Get vendor points detail error:", error);
      throw error;
    }
  }

  /**
   * Supplier: Manually adjust vendor points
   */
  async adjustVendorPoints(supplierId, vendorId, pointsChange, reason) {
    try {
      const vendor = await User.findById(vendorId);
      const supplier = await User.findById(supplierId);

      if (!vendor) {
        throw new Error("Vendor not found");
      }

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      if (vendor.role !== "vendor") {
        throw new Error("Can only adjust points for vendors");
      }

      if (!reason || reason.trim() === "") {
        throw new Error("Reason is required for point adjustment");
      }

      // Update points
      const oldPoints = vendor.loyaltyPoints || 0;
      vendor.loyaltyPoints = Math.max(0, oldPoints + pointsChange);

      // Recheck eligibility
      if (supplier.discountSettings?.enabled) {
        vendor.discountEligible =
          vendor.loyaltyPoints >= supplier.discountSettings.pointsRequired;
      }

      await vendor.save();

      console.log(
        `✅ Adjusted points for vendor ${vendor.name}: ${oldPoints} → ${vendor.loyaltyPoints} (${pointsChange > 0 ? "+" : ""}${pointsChange})`
      );

      return {
        success: true,
        message: `Points ${pointsChange > 0 ? "added" : "deducted"} successfully`,
        adjustment: {
          previousPoints: oldPoints,
          pointsChanged: pointsChange,
          newPoints: vendor.loyaltyPoints,
          reason,
          discountEligible: vendor.discountEligible,
        },
      };
    } catch (error) {
      console.error("❌ Adjust vendor points error:", error);
      throw error;
    }
  }

  /**
   * Get all vendors with loyalty points for a supplier
   */
  async getSupplierVendorsWithPoints(supplierId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "loyaltyPoints",
        sortOrder = "desc",
      } = filters;
      const skip = (page - 1) * limit;

      // Get all vendors who have ordered from this supplier
      const vendorIds = await Order.distinct("buyerId", {
        sellerId: supplierId,
      });

      const query = {
        _id: { $in: vendorIds },
        role: "vendor",
      };

      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [vendors, total] = await Promise.all([
        User.find(query)
          .select(
            "name email companyName loyaltyPoints totalSpent discountEligible"
          )
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query),
      ]);

      // Get order count for each vendor
      const vendorsWithStats = await Promise.all(
        vendors.map(async (vendor) => {
          const orderCount = await Order.countDocuments({
            buyerId: vendor._id,
            sellerId: supplierId,
            status: { $in: ["delivered", "completed"] },
          });

          return {
            ...vendor.toObject(),
            orderCount,
          };
        })
      );

      return {
        success: true,
        vendors: vendorsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("❌ Get supplier vendors with points error:", error);
      throw error;
    }
  }
}

export default new LoyaltyService();
