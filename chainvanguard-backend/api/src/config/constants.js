/**
 * Application Constants
 * Centralized configuration for tax rates, fees, and other business logic constants
 */

// Tax Configuration
export const TAX_CONFIG = {
  // Pakistan Sales Tax Rate (17%)
  RATE: parseFloat(process.env.TAX_RATE || 0.17),
  RATE_PERCENTAGE: parseFloat(process.env.TAX_RATE || 0.17) * 100,
  COUNTRY: "Pakistan",
  TAX_TYPE: "Sales Tax",
};

// Shipping Configuration
export const SHIPPING_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 100,
  STANDARD_SHIPPING_THRESHOLD: 50,
  STANDARD_SHIPPING_COST: 5.99,
  REDUCED_SHIPPING_COST: 3.99,
};

// Discount Configuration
export const DISCOUNT_CONFIG = {
  DEFAULT_DISCOUNT_RATE: 0.1, // 10%
};

// Export helper function to get tax rate
export const getTaxRate = () => TAX_CONFIG.RATE;

// Export helper function to calculate tax
export const calculateTax = (subtotal) => {
  return subtotal * TAX_CONFIG.RATE;
};

// Export helper function to calculate shipping
export const calculateShipping = (subtotal) => {
  if (subtotal >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD) {
    return 0; // Free shipping
  } else if (subtotal >= SHIPPING_CONFIG.STANDARD_SHIPPING_THRESHOLD) {
    return SHIPPING_CONFIG.REDUCED_SHIPPING_COST;
  } else {
    return SHIPPING_CONFIG.STANDARD_SHIPPING_COST;
  }
};

export default {
  TAX_CONFIG,
  SHIPPING_CONFIG,
  DISCOUNT_CONFIG,
  getTaxRate,
  calculateTax,
  calculateShipping,
};
