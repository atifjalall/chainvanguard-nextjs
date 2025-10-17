import { randomBytes, createHash } from "crypto";

// Generate random string
const generateRandomString = (length = 32) => {
  return randomBytes(length).toString("hex");
};

// Hash data
const hashData = (data) => {
  return createHash("sha256").update(data).digest("hex");
};

// Paginate query
const paginate = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

// Build pagination response
const buildPaginationResponse = (data, page, limit, total) => {
  return {
    data,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

// Format currency
const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Calculate percentage
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

// Generate SKU
const generateSKU = (prefix = "PRD") => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9_.-]/gi, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

// Calculate estimated delivery
const calculateEstimatedDelivery = (days = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Format date
const formatDate = (date, format = "full") => {
  const d = new Date(date);

  if (format === "short") {
    return d.toLocaleDateString("en-US");
  } else if (format === "medium") {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } else {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

// Sleep function
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Retry function
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(delay);
    }
  }
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove undefined values from object
const removeUndefined = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
};

export {
  generateRandomString,
  hashData,
  paginate,
  buildPaginationResponse,
  formatCurrency,
  calculatePercentage,
  generateSKU,
  isValidEmail,
  isValidPhone,
  sanitizeFilename,
  calculateEstimatedDelivery,
  formatDate,
  sleep,
  retry,
  deepClone,
  removeUndefined,
};
