import {
  randomBytes,
  createHash,
  createCipheriv,
  createDecipheriv,
} from "crypto";

// ========================================
// CRYPTOGRAPHY UTILITIES
// ========================================

/**
 * Generate random string
 */
export const generateRandomString = (length = 32) => {
  return randomBytes(length).toString("hex");
};

/**
 * Hash data using SHA-256
 */
export const hashData = (data) => {
  return createHash("sha256").update(data).digest("hex");
};

/**
 * Hash password with salt (use bcrypt instead for production)
 */
export const hashPassword = (password, salt = null) => {
  if (!salt) salt = randomBytes(16).toString("hex");
  const hash = createHash("sha512")
    .update(password + salt)
    .digest("hex");
  return { hash, salt };
};

/**
 * Encrypt data (AES-256-CBC)
 */
export const encrypt = (text, secretKey) => {
  const key = createHash("sha256").update(secretKey).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

/**
 * Decrypt data (AES-256-CBC)
 */
export const decrypt = (encryptedText, secretKey) => {
  const key = createHash("sha256").update(secretKey).digest();
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// ========================================
// PAGINATION UTILITIES
// ========================================

/**
 * Apply pagination to mongoose query
 */
export const paginate = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

/**
 * Build pagination response
 */
export const buildPaginationResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      totalPages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  };
};

// ========================================
// FORMATTING UTILITIES
// ========================================

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = "PKR", locale = "en-PK") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Format number with commas
 */
export const formatNumber = (number, decimals = 0) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total, decimals = 2) => {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(decimals));
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Format date
 */
export const formatDate = (date, format = "full") => {
  const d = new Date(date);

  const formats = {
    short: { dateStyle: "short" },
    medium: { year: "numeric", month: "short", day: "numeric" },
    long: { year: "numeric", month: "long", day: "numeric" },
    full: {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    time: { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  };

  return d.toLocaleDateString("en-US", formats[format] || formats.full);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffMonth < 12)
    return `${diffMonth} month${diffMonth > 1 ? "s" : ""} ago`;
  return `${diffYear} year${diffYear > 1 ? "s" : ""} ago`;
};

// ========================================
// GENERATION UTILITIES
// ========================================

/**
 * Generate SKU
 */
export const generateSKU = (prefix = "PRD") => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate order number
 */
export const generateOrderNumber = (prefix = "ORD") => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}${month}${day}-${random}`;
};

/**
 * Generate invoice number
 */
export const generateInvoiceNumber = () => {
  return generateOrderNumber("INV");
};

/**
 * Generate tracking number
 */
export const generateTrackingNumber = () => {
  const prefix = "TRK";
  const random = randomBytes(8).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
};

/**
 * Generate slug from text
 */
export const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

/**
 * Validate URL
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate date
 */
export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

// ========================================
// STRING UTILITIES
// ========================================

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9_.\-]/gi, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 100, suffix = "...") => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert to title case
 */
export const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

/**
 * Convert to camelCase
 */
export const toCamelCase = (str) => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "");
};

/**
 * Convert to snake_case
 */
export const toSnakeCase = (str) => {
  return str
    .replace(/\W+/g, " ")
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join("_");
};

/**
 * Extract numbers from string
 */
export const extractNumbers = (str) => {
  const matches = str.match(/\d+/g);
  return matches ? matches.join("") : "";
};

// ========================================
// ARRAY & OBJECT UTILITIES
// ========================================

/**
 * Remove duplicates from array
 */
export const removeDuplicates = (arr) => {
  return [...new Set(arr)];
};

/**
 * Shuffle array
 */
export const shuffleArray = (arr) => {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Sort array of objects
 */
export const sortByKey = (array, key, order = "asc") => {
  return array.sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (order === "asc") {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Merge objects deeply
 */
export const deepMerge = (target, source) => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

/**
 * Remove undefined/null values from object
 */
export const removeUndefined = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  );
};

/**
 * Check if value is object
 */
export const isObject = (item) => {
  return item && typeof item === "object" && !Array.isArray(item);
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// ========================================
// DATE UTILITIES
// ========================================

/**
 * Calculate estimated delivery
 */
export const calculateEstimatedDelivery = (days = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Get date range
 */
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Check if date is in past
 */
export const isDateInPast = (date) => {
  return new Date(date) < new Date();
};

/**
 * Check if date is in future
 */
export const isDateInFuture = (date) => {
  return new Date(date) > new Date();
};

/**
 * Get days difference between dates
 */
export const getDaysDifference = (date1, date2) => {
  const diffTime = Math.abs(new Date(date2) - new Date(date1));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ========================================
// ASYNC UTILITIES
// ========================================

/**
 * Sleep/delay function
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry async function
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(delay * (i + 1)); // Exponential backoff
    }
  }
};

/**
 * Timeout promise
 */
export const timeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), ms)
    ),
  ]);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ========================================
// EXPORTS
// ========================================

export default {
  // Crypto
  generateRandomString,
  hashData,
  hashPassword,
  encrypt,
  decrypt,

  // Pagination
  paginate,
  buildPaginationResponse,

  // Formatting
  formatCurrency,
  formatNumber,
  calculatePercentage,
  formatFileSize,
  formatDate,
  formatRelativeTime,

  // Generation
  generateSKU,
  generateOrderNumber,
  generateInvoiceNumber,
  generateTrackingNumber,
  generateSlug,

  // Validation
  isValidEmail,
  isValidPhone,
  isValidURL,
  isValidObjectId,
  isValidDate,

  // String
  sanitizeFilename,
  truncateText,
  capitalize,
  toTitleCase,
  toCamelCase,
  toSnakeCase,
  extractNumbers,

  // Array & Object
  removeDuplicates,
  shuffleArray,
  groupBy,
  sortByKey,
  deepClone,
  deepMerge,
  removeUndefined,
  isObject,
  isEmpty,

  // Date
  calculateEstimatedDelivery,
  getDateRange,
  isDateInPast,
  isDateInFuture,
  getDaysDifference,

  // Async
  sleep,
  retry,
  timeout,
  debounce,
  throttle,
};
