/**
 * Application Constants
 * Centralized configuration for tax rates, fees, and other business logic constants
 */

// Tax Configuration (Pakistan Sales Tax)
export const TAX_CONFIG = {
  // Pakistan Sales Tax Rate (17%)
  RATE: 0.17,
  RATE_PERCENTAGE: 17,
  COUNTRY: "Pakistan",
  TAX_TYPE: "Sales Tax",
} as const;

// Shipping Configuration
export const SHIPPING_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 100,
  STANDARD_SHIPPING_THRESHOLD: 50,
  STANDARD_SHIPPING_COST: 5.99,
  REDUCED_SHIPPING_COST: 3.99,
} as const;

// Helper Functions
export const calculateTax = (subtotal: number): number => {
  return subtotal * TAX_CONFIG.RATE;
};

export const calculateShipping = (subtotal: number): number => {
  if (subtotal >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD) {
    return 0; // Free shipping
  } else if (subtotal >= SHIPPING_CONFIG.STANDARD_SHIPPING_THRESHOLD) {
    return SHIPPING_CONFIG.REDUCED_SHIPPING_COST;
  } else {
    return SHIPPING_CONFIG.STANDARD_SHIPPING_COST;
  }
};

export const getTaxRate = (): number => TAX_CONFIG.RATE;

export const getTaxPercentage = (): number => TAX_CONFIG.RATE_PERCENTAGE;
