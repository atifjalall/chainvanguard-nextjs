// src/lib/utils/product-validation.ts

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate product name
 */
export const validateProductName = (name: string): ValidationError | null => {
  if (!name || !name.trim()) {
    return { field: "name", message: "Product name is required" };
  }
  if (name.length < 3) {
    return {
      field: "name",
      message: "Product name must be at least 3 characters",
    };
  }
  if (name.length > 200) {
    return {
      field: "name",
      message: "Product name must not exceed 200 characters",
    };
  }
  return null;
};

/**
 * Validate product description
 */
export const validateDescription = (
  description: string
): ValidationError | null => {
  if (!description || !description.trim()) {
    return { field: "description", message: "Description is required" };
  }
  if (description.length < 10) {
    return {
      field: "description",
      message: "Description must be at least 10 characters",
    };
  }
  if (description.length > 5000) {
    return {
      field: "description",
      message: "Description must not exceed 5000 characters",
    };
  }
  return null;
};

/**
 * Validate price
 */
export const validatePrice = (
  price: string | number
): ValidationError | null => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return { field: "price", message: "Price must be a valid number" };
  }
  if (numPrice <= 0) {
    return { field: "price", message: "Price must be greater than 0" };
  }
  if (numPrice > 1000000) {
    return { field: "price", message: "Price seems unreasonably high" };
  }
  return null;
};

/**
 * Validate quantity
 */
export const validateQuantity = (
  quantity: string | number
): ValidationError | null => {
  const numQuantity =
    typeof quantity === "string" ? parseInt(quantity) : quantity;

  if (isNaN(numQuantity)) {
    return { field: "quantity", message: "Quantity must be a valid number" };
  }
  if (numQuantity < 0) {
    return { field: "quantity", message: "Quantity cannot be negative" };
  }
  if (numQuantity > 1000000) {
    return { field: "quantity", message: "Quantity seems unreasonably high" };
  }
  return null;
};

/**
 * Validate SKU format (if provided)
 */
export const validateSKU = (sku: string): ValidationError | null => {
  if (!sku) return null; // SKU is optional

  if (sku.length < 3) {
    return { field: "sku", message: "SKU must be at least 3 characters" };
  }
  if (sku.length > 50) {
    return { field: "sku", message: "SKU must not exceed 50 characters" };
  }
  // Allow alphanumeric, hyphens, and underscores
  if (!/^[A-Z0-9-_]+$/i.test(sku)) {
    return {
      field: "sku",
      message:
        "SKU can only contain letters, numbers, hyphens, and underscores",
    };
  }
  return null;
};

/**
 * Validate apparel size
 */
export const validateSize = (size: string): ValidationError | null => {
  const validSizes = [
    "XXS",
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "XXXL",
    "Free Size",
  ];

  if (!size) {
    return { field: "size", message: "Size is required" };
  }
  if (!validSizes.includes(size)) {
    return { field: "size", message: "Invalid size selected" };
  }
  return null;
};

/**
 * Validate color
 */
export const validateColor = (color: string): ValidationError | null => {
  if (!color || !color.trim()) {
    return { field: "color", message: "Color is required" };
  }
  if (color.length < 2) {
    return { field: "color", message: "Color must be at least 2 characters" };
  }
  if (color.length > 50) {
    return { field: "color", message: "Color must not exceed 50 characters" };
  }
  return null;
};

/**
 * Validate material
 */
export const validateMaterial = (material: string): ValidationError | null => {
  if (!material || !material.trim()) {
    return { field: "material", message: "Material is required" };
  }
  if (material.length < 2) {
    return {
      field: "material",
      message: "Material must be at least 2 characters",
    };
  }
  if (material.length > 200) {
    return {
      field: "material",
      message: "Material must not exceed 200 characters",
    };
  }
  return null;
};

/**
 * Validate category
 */
export const validateCategory = (category: string): ValidationError | null => {
  const validCategories = ["Men", "Women", "Kids", "Unisex"];

  if (!category) {
    return { field: "category", message: "Category is required" };
  }
  if (!validCategories.includes(category)) {
    return { field: "category", message: "Invalid category selected" };
  }
  return null;
};

/**
 * Validate subcategory
 */
export const validateSubcategory = (
  subcategory: string,
  category: string
): ValidationError | null => {
  if (!subcategory) {
    return { field: "subcategory", message: "Subcategory is required" };
  }

  // You can add more specific validation based on category if needed
  if (!category) {
    return {
      field: "subcategory",
      message: "Please select a category first",
    };
  }

  return null;
};

/**
 * Validate images
 */
export const validateImages = (images: File[]): ValidationError | null => {
  if (!images || images.length === 0) {
    return {
      field: "images",
      message: "At least one product image is required",
    };
  }

  if (images.length > 5) {
    return { field: "images", message: "Maximum 5 images allowed" };
  }

  // Validate each image
  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    // Check file type
    if (!image.type.startsWith("image/")) {
      return {
        field: "images",
        message: `File ${image.name} is not a valid image`,
      };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (image.size > maxSize) {
      return {
        field: "images",
        message: `Image ${image.name} exceeds maximum size of 10MB`,
      };
    }

    // Check supported formats
    const supportedFormats = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!supportedFormats.includes(image.type)) {
      return {
        field: "images",
        message: `Image ${image.name} format not supported. Use JPG, PNG, or WebP`,
      };
    }
  }

  return null;
};

/**
 * Validate tags
 */
export const validateTags = (tags: string[]): ValidationError | null => {
  if (!tags || !Array.isArray(tags)) return null; // Tags are optional

  if (tags.length > 20) {
    return { field: "tags", message: "Maximum 20 tags allowed" };
  }

  for (const tag of tags) {
    if (tag.length < 2) {
      return {
        field: "tags",
        message: "Each tag must be at least 2 characters",
      };
    }
    if (tag.length > 30) {
      return {
        field: "tags",
        message: "Each tag must not exceed 30 characters",
      };
    }
  }

  return null;
};

/**
 * Validate weight
 */
export const validateWeight = (
  weight: string | number
): ValidationError | null => {
  if (!weight) return null; // Weight is optional

  const numWeight = typeof weight === "string" ? parseFloat(weight) : weight;

  if (isNaN(numWeight)) {
    return { field: "weight", message: "Weight must be a valid number" };
  }
  if (numWeight < 0) {
    return { field: "weight", message: "Weight cannot be negative" };
  }
  if (numWeight > 1000) {
    return {
      field: "weight",
      message: "Weight seems unreasonably high (max 1000kg)",
    };
  }
  return null;
};

/**
 * Validate shipping cost
 */
export const validateShippingCost = (
  cost: string | number,
  freeShipping: boolean
): ValidationError | null => {
  if (freeShipping) return null; // No validation needed for free shipping

  const numCost = typeof cost === "string" ? parseFloat(cost) : cost;

  if (isNaN(numCost)) {
    return {
      field: "shippingCost",
      message: "Shipping cost must be a valid number",
    };
  }
  if (numCost < 0) {
    return {
      field: "shippingCost",
      message: "Shipping cost cannot be negative",
    };
  }
  if (numCost > 1000) {
    return {
      field: "shippingCost",
      message: "Shipping cost seems unreasonably high",
    };
  }
  return null;
};

/**
 * Validate entire product form (Step 1)
 */
export const validateBasicInformation = (data: {
  name: string;
  description: string;
  category: string;
  subcategory: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  const nameError = validateProductName(data.name);
  if (nameError) errors.push(nameError);

  const descError = validateDescription(data.description);
  if (descError) errors.push(descError);

  const catError = validateCategory(data.category);
  if (catError) errors.push(catError);

  const subcatError = validateSubcategory(data.subcategory, data.category);
  if (subcatError) errors.push(subcatError);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate apparel details (Step 2)
 */
export const validateApparelDetails = (data: {
  size: string;
  color: string;
  material: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  const sizeError = validateSize(data.size);
  if (sizeError) errors.push(sizeError);

  const colorError = validateColor(data.color);
  if (colorError) errors.push(colorError);

  const materialError = validateMaterial(data.material);
  if (materialError) errors.push(materialError);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate pricing and inventory (Step 3)
 */
export const validatePricingInventory = (data: {
  price: string | number;
  quantity: string | number;
  sku?: string;
  weight?: string | number;
  freeShipping: boolean;
  shippingCost?: string | number;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  const priceError = validatePrice(data.price);
  if (priceError) errors.push(priceError);

  const qtyError = validateQuantity(data.quantity);
  if (qtyError) errors.push(qtyError);

  if (data.sku) {
    const skuError = validateSKU(data.sku);
    if (skuError) errors.push(skuError);
  }

  if (data.weight) {
    const weightError = validateWeight(data.weight);
    if (weightError) errors.push(weightError);
  }

  if (!data.freeShipping && data.shippingCost) {
    const shippingError = validateShippingCost(
      data.shippingCost,
      data.freeShipping
    );
    if (shippingError) errors.push(shippingError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(price);
};

/**
 * Format date for display
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
};

/**
 * Generate SKU suggestion based on category and size
 */
export const generateSKUSuggestion = (
  category: string,
  subcategory: string,
  size: string
): string => {
  const catPrefix = category.substring(0, 3).toUpperCase();
  const subcatPrefix = subcategory.substring(0, 3).toUpperCase();
  const sizeCode = size.substring(0, 1);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `${catPrefix}-${subcatPrefix}-${sizeCode}-${random}`;
};

/**
 * Check if product is low on stock
 */
export const isLowStock = (
  quantity: number,
  minStockLevel: number
): boolean => {
  return quantity <= minStockLevel;
};

/**
 * Check if product is out of stock
 */
export const isOutOfStock = (quantity: number): boolean => {
  return quantity === 0;
};

/**
 * Get stock status
 */
export const getStockStatus = (
  quantity: number,
  minStockLevel: number
): "in_stock" | "low_stock" | "out_of_stock" => {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= minStockLevel) return "low_stock";
  return "in_stock";
};

/**
 * Get stock status color
 */
export const getStockStatusColor = (
  status: "in_stock" | "low_stock" | "out_of_stock"
): string => {
  switch (status) {
    case "in_stock":
      return "green";
    case "low_stock":
      return "amber";
    case "out_of_stock":
      return "red";
    default:
      return "gray";
  }
};
