/* eslint-disable @typescript-eslint/no-explicit-any */
import { WalletData } from "./web3";

// User and Authentication Types
export interface User {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  walletAddress: string;
  walletName: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  // Business info for suppliers/vendors
  companyName?: string;
  businessAddress?: string;
  businessType?: string;
  registrationNumber?: string;

  averageRating?: number; // Supplier's average rating (0-5)
  totalRatings?: number; // Total number of ratings received

  // Hyperledger specific
  networkType: "hyperledger-fabric";
  organizationMSP: string;
  isAuthenticated: boolean;
  createdAt: string;
  updatedAt: string;
  loginAt?: string;
  avatar?: string;
}

// ========================================
// SUPPLIER RATING TYPES
// ========================================

export interface SupplierRating {
  _id: string;
  ratingId: string;
  vendorId: string;
  vendorName: string;
  supplierId: string;
  supplierName: string;
  ratings: {
    quality: number; // 1-5
    delivery: number; // 1-5
    pricing: number; // 1-5
    communication: number; // 1-5
  };
  overallRating: number; // Auto-calculated average
  comment?: string;
  completedOrdersCount: number;
  sampleOrders: string[];
  isEdited: boolean;
  editHistory?: EditHistory[];
  lastEditedAt?: string;
  supplierResponse?: {
    comment: string;
    respondedBy: string;
    respondedAt: string;
  };
  status: "approved" | "pending" | "flagged" | "removed";
  isFlagged: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  blockchainTxId?: string;
  blockchainVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EditHistory {
  previousRatings: {
    quality: number;
    delivery: number;
    pricing: number;
    communication: number;
  };
  previousOverallRating: number;
  previousComment: string;
  editedAt: string;
}

export interface SupplierRatingStats {
  totalRatings: number;
  averageOverall: number;
  averageQuality: number;
  averageDelivery: number;
  averagePricing: number;
  averageCommunication: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  withCommentsCount: number;
}

export interface RatingEligibility {
  eligible: boolean;
  reason?: string;
  completedOrdersCount: number;
  sampleOrders?: string[];
}

export interface SubmitRatingData {
  ratings: {
    quality: number;
    delivery: number;
    pricing: number;
    communication: number;
  };
  comment?: string;
}

export type UserRole = "supplier" | "vendor" | "customer" | "expert";

export interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  login: (walletAddress: string, password: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
  updateProfile: (userData: Partial<User>) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface RegisterData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  role: UserRole;
  walletName: string;
  walletAddress?: string;
  // Business details
  companyName?: string;
  businessAddress?: string;
  businessType?: string;
  registrationNumber?: string;
}

// Add these to your existing WalletContextType interface
export interface WalletContextType {
  currentWallet: WalletData | null;
  isConnected: boolean;
  balance: number;
  transactions: Transaction[];
  connectWallet: (walletId: string, password: string) => Promise<boolean>;
  disconnectWallet: () => void;
  createWallet: (name: string, password: string) => Promise<WalletData>;
  getAllWallets: () => WalletData[];
  generateRecoveryPhrase: () => string;
  recoverWallet: (
    recoveryPhrase: string,
    newPassword: string
  ) => Promise<WalletData>;
  isLoading: boolean;
  updateBalance: (newBalance: number) => void;
  refreshBalance?: () => Promise<void>;
  refreshTransactions?: () => Promise<void>;
}

export interface HyperledgerWallet {
  id: string;
  name: string;
  address: string;
  publicKey: string;
  networkType: "hyperledger-fabric";
  organizationMSP: string;
  createdAt: string;
}

// ========================================
// PRODUCT TYPES - COMPLETE BACKEND SYNC
// ========================================

export interface ApparelDetails {
  // Size & Fit
  size: "XXS" | "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL" | "Free Size";
  fit?: "Slim Fit" | "Regular Fit" | "Loose Fit" | "Oversized";

  // Style Details
  color: string;
  pattern?:
    | "Solid"
    | "Striped"
    | "Checked"
    | "Printed"
    | "Floral"
    | "Abstract"
    | "Geometric"
    | "Polka Dot";

  // Material & Fabric
  material: string; // e.g., "100% Cotton"
  fabricType?:
    | "Cotton"
    | "Polyester"
    | "Silk"
    | "Wool"
    | "Linen"
    | "Denim"
    | "Jersey"
    | "Chiffon"
    | "Satin"
    | "Velvet";
  fabricWeight?: string; // e.g., "180 GSM"
  careInstructions?: string;

  // Design Details
  neckline?:
    | "Round Neck"
    | "V-Neck"
    | "Crew Neck"
    | "Polo Neck"
    | "Boat Neck"
    | "Off-Shoulder"
    | "Collar";
  sleeveLength?:
    | "Sleeveless"
    | "Short Sleeve"
    | "3/4 Sleeve"
    | "Long Sleeve"
    | "Full Sleeve";
}

export interface ProductImage {
  url: string;
  ipfsHash?: string;
  cloudinaryId?: string;
  isMain: boolean;
}

export interface ProductReview {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  images?: string[];
  createdAt: Date;
  helpful: number;
}

export interface Product {
  rating: number;
  size: string;
  shipping: any;
  // MongoDB ID
  id: string;
  _id: string;

  // Basic Information
  name: string;
  description: string;

  // Category System
  category: "Men" | "Women" | "Kids" | "Unisex";
  subcategory:
    | "T-Shirts"
    | "Shirts"
    | "Blouses"
    | "Sweaters"
    | "Hoodies"
    | "Jackets"
    | "Coats"
    | "Jeans"
    | "Trousers"
    | "Shorts"
    | "Skirts"
    | "Dresses"
    | "Suits"
    | "Jumpsuits"
    | "Scarves"
    | "Belts"
    | "Hats"
    | "Bags"
    | "Shoes"
    | "Sneakers"
    | "Boots"
    | "Sandals"
    | "Activewear"
    | "Sleepwear"
    | "Swimwear"
    | "Underwear";

  productType?:
    | "Casual"
    | "Formal"
    | "Sports"
    | "Party"
    | "Traditional"
    | "Workwear";
  brand?: string;

  // QR Code
  qrCode?: string;
  qrCodeImageUrl?: string;

  // Apparel-Specific Attributes
  apparelDetails: ApparelDetails;

  // Pricing
  price: number;
  costPrice?: number;
  originalPrice?: number;
  discount?: number;

  // Inventory
  quantity: number;
  reservedQuantity?: number;
  minStockLevel: number;
  sku: string;
  slug: string;
  inStock?: boolean; // From API browse response

  // Images
  images: ProductImage[];

  // Physical Properties
  weight?: number;
  dimensions?: string;

  // Tags & Metadata
  tags: string[];
  season?: "Summer" | "Winter" | "Monsoon" | "All Season";
  countryOfOrigin?: string;
  manufacturer?: string;

  // Seller Information
  sellerId: string;
  sellerName: string;
  sellerWalletAddress?: string;

  // Legacy compatibility
  supplierId?: string;
  supplierName?: string;

  // Add vendor property for API responses
  vendor?: {
    id?: string;
    name: string;
  };

  // Status
  status:
    | "draft"
    | "active"
    | "inactive"
    | "low_stock"
    | "out_of_stock"
    | "discontinued"
    | "archived";

  isVerified: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;

  // Certifications
  isSustainable: boolean;
  certifications: string[];

  // Ratings & Reviews
  averageRating: number;
  totalReviews: number;
  reviews?: ProductReview[];

  // Sales & Views
  totalSold: number;
  views: number;
  lastViewedAt?: Date | string;
  lastSoldAt?: Date | string;
  reviewCount?: number;

  // Blockchain
  blockchainProductId?: string;
  blockchainVerified: boolean;
  ipfsHash?: string;
  fabricTransactionId?: string;

  // Shipping
  freeShipping: boolean;
  shippingCost: number;
  estimatedDeliveryDays?: number;

  // Dates
  lastRestockedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Virtuals (computed fields)
  availableQuantity?: number;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  url?: string;

  // Legacy fields for backward compatibility
  manufacturingDate?: string;
  expiryDate?: string;
  warranty?: string;
  origin?: string;
  minimumOrderQuantity?: number;
  model?: string;
  color?: string;
  material?: string;
}

export type ProductStatus =
  | "active"
  | "inactive"
  | "out-of-stock"
  | "out_of_stock"
  | "discontinued"
  | "available"
  | "reserved"
  | "sold"
  | "pending-approval"
  | "draft"
  | "archived";

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  images: File[];
}

export interface ProductListResponse {
  success: boolean;
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductResponse {
  data: never[];
  success: boolean;
  product: Product;
  message?: string;
}

export interface ProductStatsResponse {
  success: boolean;
  stats: {
    totalProducts: number;
    activeProducts: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
    averagePrice: number;
  };
}
// ========================================
// WISHLIST TYPES
// ========================================

export interface WishlistItem {
  _id: string;
  productId: Product;
  notes?: string;
  addedAt: string;
  priceWhenAdded: number;
  notifyOnPriceDrop?: boolean;
  notifyOnBackInStock?: boolean;
}

export interface Wishlist {
  _id: string;
  userId: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WishlistStats {
  totalItems: number;
  totalValue: number;
  inStockItems: number;
  outOfStockItems: number;
  averagePriceWhenAdded: number;
  priceDifferenceTotal: number;
}

// ========================================
// BLOCKCHAIN TYPES
// ========================================

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
  status: string;
  txHash?: string;
  category?: string;
  counterparty?: string;
}

export interface BlockchainTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  timestamp: string;
  type: TransactionType;
  status: TransactionStatus;
  metadata?: Record<string, unknown>;
}

export type TransactionType =
  | "product-creation"
  | "product-transfer"
  | "payment"
  | "consensus"
  | "audit"
  | "wallet-creation"
  | "identity-verification";

export type TransactionStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "cancelled";

// Smart Contract Types
export interface ContractMethod {
  name: string;
  type: string;
  inputs: ContractInput[];
  outputs: ContractOutput[];
}

export interface ContractInput {
  name: string;
  type: string;
  indexed?: boolean;
}

export interface ContractOutput {
  name: string;
  type: string;
}

export interface SmartContract {
  address: string;
  abi: ContractMethod[];
  name: string;
  version: string;
  deployedAt: string;
}

// ========================================
// VENDOR REQUEST TYPES
// ========================================

export interface VendorRequestItem {
  inventoryId: string;
  inventoryName?: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  inventory?: {
    _id: string;
    name: string;
    category?: string;
    unit?: string;
  };
}

export interface VendorReturnStats {
  total: number;
  requested: number;
  approved: number;
  rejected: number;
  refunded: number;
  totalRefunded: number;
  pendingAmount: number;
}

export interface VendorRequest {
  _id: string;
  id: string;
  requestNumber: string;

  // Parties
  vendorId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        companyName?: string;
        walletAddress?: string;
      };
  supplierId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        companyName?: string;
        walletAddress?: string;
      };

  // Items
  items: VendorRequestItem[];

  // Pricing
  subtotal: number;
  tax: number;
  total: number;

  // Status - matches backend enum
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";

  // Notes
  vendorNotes?: string;
  supplierNotes?: string;

  // Review info
  reviewedAt?: string | Date;
  reviewedBy?: string;
  rejectionReason?: string;
  autoApproved?: boolean;

  // Order reference (after payment)
  orderId?: string;

  // Shipping address (saved when vendor pays)
  shippingAddress?: {
    name?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    addressType?: "home" | "office" | "other";
  };

  // Payment timestamp
  paidAt?: string | Date;

  // Completion
  isCompleted: boolean;
  completedAt?: string | Date;

  // Blockchain
  blockchainTxId?: string;
  blockchainVerified: boolean;
  blockchainRequestId?: string;

  // Dates
  createdAt: string | Date;
  updatedAt: string | Date;

  // Frontend extensions
  urgency?: "low" | "medium" | "high";
  category?: string;
}

export interface VendorRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  completed: number;
  totalValue: number;
  avgRequestValue: number;
}

export interface VendorRequestListResponse {
  success: boolean;
  requests: VendorRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface VendorRequestResponse {
  success: boolean;
  request: VendorRequest;
  message?: string;
}

export interface VendorRequestStatsResponse {
  success: boolean;
  stats: VendorRequestStats;
}

export interface CreateVendorRequestData {
  supplierId: string;
  items: {
    inventoryId: string;
    quantity: number;
  }[];
  vendorNotes?: string;
}

export interface ApproveRequestData {
  supplierNotes?: string;
}

export interface RejectRequestData {
  rejectionReason: string;
}

// ========================================
// ORDER TYPES
// ========================================

export interface Order {
  _id?: string;
  id?: string;
  orderNumber: string;

  // Customer info
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerWalletAddress: string;

  // Seller info
  sellerId: string;
  sellerName: string;
  sellerWalletAddress: string;
  sellerRole?: "vendor" | "supplier";

  // Order items (backend uses 'items' not 'products')
  items: OrderItem[];
  products?: OrderItem[]; // Keep for backwards compatibility

  // Pricing
  subtotal: number;
  shippingCost?: number;
  tax?: number;
  discount?: number;
  discountCode?: string;
  total: number;
  totalAmount?: number; // Alias for total
  currency?: string;

  // Status
  status: OrderStatus;
  statusHistory?: StatusHistory[];

  // Shipping Address (full structure from backend)
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    addressType?: "home" | "office" | "other";
  };

  // Billing Address
  billingAddress?: {
    name?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };

  // Shipping details
  shippingMethod?: "standard" | "express" | "overnight" | "pickup";
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  trackingNumber?: string;
  trackingId?: string; // Alias for trackingNumber
  trackingUrl?: string;
  courierName?:
    | "FedEx"
    | "UPS"
    | "DHL"
    | "USPS"
    | "Local"
    | "Other"
    | "TCS"
    | "Leopard"
    | "";
  carrier?: string; // Alias for courierName

  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  paymentIntentId?: string;
  transactionHash?: string;
  paidAt?: string;

  // Blockchain
  blockchainOrderId?: string;
  blockchainTxId?: string;
  blockchainTxHash?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  processingAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;

  // Additional
  customerNotes?: string;
  specialInstructions?: string;
  isGift?: boolean;
  giftMessage?: string;
  cancellationReason?: string;
  refundAmount?: number;
  refundReason?: string;

  // Return fields
  returnRequested?: boolean;
  returnStatus?: string;
  returnReason?: string;
}

export interface OrderItem {
  _id?: string;
  productId: string | Product; // Can be populated with Product object
  productName: string;
  productImage?: string; // Direct image URL
  sku?: string;
  quantity: number;
  price: number;
  subtotal: number;
  productSnapshot?: {
    category?: string;
    subcategory?: string;
    brand?: string;
    apparelDetails?: {
      size?: string;
      color?: string;
      material?: string;
      fit?: string;
    };
    images?: Array<{
      url?: string;
      cloudinaryUrl?: string;
      isMain?: boolean;
    }>;
    blockchainProductId?: string;
  };
  image?: string; // For backwards compatibility
  trackingQRCode?: string;
  sellerId?: string;
  sellerName?: string;
  sellerWalletAddress?: string;
}

export interface StatusHistory {
  status: OrderStatus;
  changedBy?: string;
  changedByRole?: "customer" | "vendor" | "supplier" | "expert";
  timestamp: string;
  notes?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type PaymentMethod =
  | "wallet"
  | "card"
  | "cod"
  | "bank_transfer"
  | "credit_card"
  | "debit_card"
  | "crypto";

// ========================================
// CART TYPES
// ========================================

export interface CartItem {
  _id: string;
  productId: string | Product;
  quantity: number;
  price: number;
  subtotal: number;
  productName?: string;
  productImage?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedFit?: string;
  sellerId?: string;
  sellerName?: string;
  addedAt?: string;
}

export interface Cart {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  shipping?: number;
  updatedAt?: string;
}

export interface CartSummary {
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  totalAmount: number;
}

// ========================================
// VENDOR CUSTOMER MANAGEMENT TYPES
// ========================================

export interface VendorCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  memberSince: string;
  loyaltyPoints: number;
  stats: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderDate: string | null;
  };
}

export interface VendorCustomerStats {
  totalCustomers: number;
  totalRevenue: number;
  avgCustomerValue: number;
  newCustomersThisMonth: number;
}

export interface CustomerDetailResponse {
  success: boolean;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    memberSince: string;
    loyaltyPoints: number;
  };
  statistics: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    firstOrderDate?: string;
    lastOrderDate?: string;
    ordersByStatus: Record<string, number>;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    amount: number;
    status: OrderStatus;
    itemCount: number;
    date: string;
    blockchainTxId?: string | null;
    blockchainVerified?: boolean;
  }>;
}

export interface CustomerOrdersListResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CustomerContactInfo {
  name: string;
  email: string;
  phone?: string;
}

export type CustomerStatus = "active" | "new" | "at-risk";

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus | "All Status";
  sortBy?: "totalSpent" | "totalOrders" | "loyaltyPoints" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ========================================
// IPFS TYPES
// ========================================

export interface IPFSFile {
  hash: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface IPFSUploadResponse {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

// ========================================
// HYPERLEDGER FABRIC TYPES
// ========================================

export interface FabricConnectionProfile {
  name: string;
  version: string;
  client: {
    organization: string;
    connection: {
      timeout: {
        peer: {
          endorser: string;
        };
      };
    };
  };
  organizations: Record<string, unknown>;
  orderers: Record<string, unknown>;
  peers: Record<string, unknown>;
  certificateAuthorities: Record<string, unknown>;
}

export interface FabricWallet {
  put: (label: string, identity: unknown) => Promise<void>;
  get: (label: string) => Promise<unknown>;
  exists: (label: string) => Promise<boolean>;
  remove: (label: string) => Promise<void>;
}

export interface FabricNetwork {
  channelName: string;
  contractName: string;
  connectionProfile: FabricConnectionProfile;
  wallet: FabricWallet;
  userId: string;
}

export interface FabricTransaction {
  txId: string;
  chaincode: string;
  function: string;
  args: string[];
  timestamp: string;
  status: "success" | "failure";
  result?: string | Record<string, unknown>;
  error?: string;
}

// ========================================
// ANALYTICS AND DASHBOARD TYPES
// ========================================

export interface DashboardMetrics {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  recentTransactions: BlockchainTransaction[];
  salesData: SalesData[];
  performanceMetrics: PerformanceMetric[];
  averageRating?: number; // Add ? to make optional
  totalRatings?: number; // Add ? to make optional
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  products: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  change: number;
  trend: "up" | "down" | "stable";
}

// ========================================
// SUPPLIER DASHBOARD TYPES
// ========================================

export interface SupplierDashboardMetrics {
  totalInventory: number;
  totalVendors: number;
  totalTransactions: number;
  totalRevenue: number;
  totalOrders: number;
  activeInventory: number;
  lowStockInventory: number;
  outOfStockInventory: number;
  pendingVendors: number;
  completedTransactions: number;
  totalInventoryValue: number;
  avgOrderValue: number;
  averageRating?: number; // 0-5
  totalRatings?: number;
}

export interface RecentActivity {
  id: string;
  type:
    | "product_added"
    | "order_received"
    | "vendor_added"
    | "stock_low"
    | "transaction_completed";
  title: string;
  description: string;
  timestamp: string;
  status?: "success" | "warning" | "info" | "danger";
  amount?: number;
  customer?: string;
}

export interface TopVendor {
  _id: string;
  id?: string;
  name: string;
  email: string;
  companyName?: string;
  totalOrders?: number;
  orderCount?: number;
  totalSpent: number;
  averageOrderValue?: number;
  avgOrderValue?: number;
  status: "active" | "pending" | "inactive";
  joinedDate?: string;
  lastOrderDate: string;
  location?: {
    city: string;
    country: string;
  };
  rating?: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  totalSold: number;
  revenue: number;
  currentStock: number;
  status: "active" | "low_stock" | "out_of_stock";
  lastSold: string;
  averageRating: number;
}

export interface SupplierAnalyticsResponse {
  success: boolean;
  timeframe: string;
  topInventoryItems?: TopProduct[];
  analytics: {
    revenue: {
      daily: Array<{
        _id: string;
        revenue: number;
        orders: number;
        avgOrderValue: number;
      }>;
      totals: {
        totalRevenue: number;
        totalOrders: number;
        avgOrderValue: number;
      };
    };
    topVendors: TopVendor[];
    inventoryStats: {
      byCategory: Array<{
        _id: string;
        totalValue: number;
        itemCount: number;
        totalQuantity: number;
        avgPrice: number;
        minStock: number;
      }>;
      overall: {
        totalInventoryValue: number;
        totalItems: number;
        totalQuantity: number;
        lowStockItems: number;
        outOfStockItems: number;
      };
    };
    requestStats: {
      byStatus: Array<{
        _id: string;
        count: number;
        totalValue: number;
      }>;
      totals: {
        totalRequests: number;
        totalValue: number;
        approved: number;
        rejected: number;
        approvalRate: string | number;
      };
    };
    orderTrends: Array<{
      _id: string;
      totalOrders: number;
      pendingOrders: number;
      completedOrders: number;
      cancelledOrders: number;
    }>;
    topProducts: any[];
  };
}

// ========================================
// INVENTORY TYPES - BACKEND SYNCED
// ========================================

export interface TextileDetails {
  fabricType?: string;
  composition?: string;
  gsm?: number;
  width?: number;
  color?: string;
  colorCode?: string;
  pattern?: string;
  finish?: string;
  careInstructions?: string;
  shrinkage?: string;
  washability?: string;
  fabricWeight?: string;
}

export interface InventoryDimensions {
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  unit: string;
}

export interface InventorySpecifications {
  grade?: string;
  thickness?: string;
  density?: string;
  tensileStrength?: string;
  durability?: string;
  washability?: string;
  breathability?: string;
  stretchability?: string;
  other?: Record<string, any>;
}

export interface StorageLocation {
  warehouse: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  quantityAtLocation: number;
  lastUpdated?: Date | string;
}

export interface BatchData {
  batchNumber: string;
  quantity: number;
  manufactureDate: Date | string;
  expiryDate?: Date | string;
  receivedDate?: Date | string;
  supplierName?: string;
  costPerUnit?: number;
  status?: "available" | "reserved" | "depleted" | "quarantined" | "expired";
  qualityCheckId?: string;
  blockchainBatchId?: string;
  _id?: string;
}

export interface InventoryMovement {
  type:
    | "initial_stock"
    | "restock"
    | "purchase"
    | "sale"
    | "return"
    | "adjustment"
    | "damage"
    | "transfer"
    | "reservation"
    | "release"
    | "quality_rejection"
    | "production"
    | "wastage";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  performedBy: string;
  performedByRole: "supplier" | "vendor" | "expert" | "customer" | "system";
  relatedOrderId?: string;
  timestamp: Date | string;
  notes?: string;
  transactionHash?: string;
}

export interface QualityCheck {
  _id?: string;
  inspector: string;
  inspectorName: string;
  inspectionDate: Date | string;
  status: "passed" | "failed" | "conditional";
  batchNumber?: string;
  checkedQuantity: number;
  passedQuantity?: number;
  rejectedQuantity?: number;
  defectTypes?: string[];
  qualityScore?: number;
  findings?: string;
  images?: Array<{ url: string; description?: string }>;
  nextInspectionDate?: Date | string;
}

export interface InventoryImage {
  url: string;
  ipfsHash?: string;
  cloudinaryId?: string;
  isMain: boolean;
  caption?: string;
}

export interface Inventory {
  fabricType: string;
  _id: string;
  id: string;

  // Basic Information
  name: string;
  description: string;

  // Category System
  category: string;
  subcategory: string;
  materialType?: string;

  // Supplier Information
  supplierId: string | { _id: string; name?: string; companyName?: string }; // Can be populated
  supplierName: string;
  supplierWalletAddress?: string;
  supplierContact?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };

  // Pricing
  pricePerUnit: number;
  costPrice?: number;
  originalPrice?: number;
  discount?: number;
  currency: string;

  // Inventory Details
  quantity: number;
  unit: string;
  minStockLevel: number;
  reorderLevel: number;
  reorderQuantity: number;
  maxStockLevel?: number;
  maximumQuantity?: number;

  // Reserved/Committed Quantities
  reservedQuantity?: number;
  committedQuantity?: number;
  damagedQuantity?: number;

  // SKU & Tracking
  sku: string;
  slug: string;
  batchNumbers?: string[];
  serialNumbers?: string[];

  // Product-Specific Details
  textileDetails?: TextileDetails;
  dimensions?: InventoryDimensions | string;
  specifications?: InventorySpecifications;
  weight?: number | string;

  // Storage & Location
  storageLocations?: StorageLocation[];
  defaultLocation?: string;

  // Quality & Compliance
  qualityGrade?: string;
  certifications?: string[];
  complianceStandards?: string[];
  safetyDataSheet?: string;

  // Images
  images: InventoryImage[] | string[];

  // Tags & Metadata
  tags: string[];
  season?: string;
  suitableFor?: string[];
  countryOfOrigin?: string;
  manufacturer?: string;

  // Status
  status:
    | "draft"
    | "active"
    | "inactive"
    | "out_of_stock"
    | "low_stock"
    | "discontinued"
    | "archived";

  // Tracking & Analytics
  totalConsumed: number;
  averageMonthlyConsumption: number;
  lastRestockedAt?: Date | string;
  lastConsumedAt?: Date | string;
  turnoverRate?: number;

  // Blockchain
  blockchainInventoryId?: string;
  blockchainVerified: boolean;
  ipfsHash?: string;
  fabricTransactionId?: string;

  // History
  movements?: InventoryMovement[];
  batches?: BatchData[];
  qualityChecks?: QualityCheck[];

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;

  // Virtuals (computed)
  availableQuantity?: number;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  stockValue?: number;
  daysUntilReorder?: number;
  url?: string;

  isBatchTracked?: boolean;
  isSustainable?: boolean;
  autoReorderEnabled?: boolean;
  leadTime?: number;
  estimatedDeliveryDays?: number;
  shelfLife?: number;
  documents?: Array<{ url: string; name: string; type: string }>;
  notes?: string;
  internalCode?: string;
  barcode?: string;
  carbonFootprint?: number | string;
  recycledContent?: number | string;
  scanHistory?: Array<any>;
  alternativeSuppliers?: Array<string>;
  qrCodeGenerated?: boolean;
  totalScans?: number;
  qrMetadata?: {
    generatedAt?: Date | string;
    generatedBy?: string;
    ipfsHash?: string;
    cloudinaryUrl?: string;
    trackingUrl?: string;
  };
  lastMovementDate?: Date | string;
  lastQualityCheckDate?: Date | string;
  sustainabilityCertifications?: string[];
  primaryLocation?: string;
  reorderAlerts?: Array<any>;
  alerts?: Array<any>;
  totalReceived?: number;
  totalRevenue?: number;
  originTransactionHash?: string;
  safetyStockLevel?: number;
  manufactureDate?: Date | string;
  expiryDate?: Date | string;
  warehouseLocation?: string;

  qrCodeImageUrl?: string;
  qrCode?: string;
}

export interface InventoryFormData {
  // Basic Information
  name: string;
  description: string;
  category: string;
  subcategory: string;
  materialType?: string;

  // Pricing
  pricePerUnit: number;
  costPrice?: number;
  currency: string;

  // Inventory
  quantity: number;
  unit: string;
  minStockLevel: number;
  reorderLevel: number;
  reorderQuantity: number;

  // SKU
  sku: string;

  // Details
  textileDetails?: TextileDetails;
  dimensions?: InventoryDimensions;
  specifications?: InventorySpecifications;

  // Storage
  storageLocations?: StorageLocation[];
  defaultLocation?: string;
  primaryLocation?: string;

  // Quality
  qualityGrade?: string;
  certifications?: string[];

  // Images
  images: string[];

  // Tags
  tags: string[];
  season?: string;
  suitableFor?: string[];
  countryOfOrigin?: string;

  // Status
  status: string;

  // Supplier Info
  supplierContact?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  batches?: BatchData[];

  isBatchTracked?: boolean;
  autoReorderEnabled?: boolean;
  leadTime?: number;
  shelfLife?: number;
  manufactureDate?: string;
  expiryDate?: string;
  safetyStockLevel?: number;
  damagedQuantity?: number;
  warehouseLocation?: string;
  notes?: string;
  internalCode?: string;
  barcode?: string;
}

export type UpdateInventoryFormData = Partial<InventoryFormData>;

export interface InventoryListResponse {
  success: boolean;
  data: Inventory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InventoryResponse {
  success: boolean;
  data: Inventory;
  message?: string;
}

export interface InventoryStatsResponse {
  success: boolean;
  data: {
    totalItems: number;
    totalValue: number;
    inStockItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    reservedItems: number;
  };
}

export interface AddStockRequest {
  quantity: number;
  notes?: string;
  batchData?: Partial<BatchData>;
}

export interface ReduceStockRequest {
  quantity: number;
  reason?: string;
  notes?: string;
}

export interface ReserveStockRequest {
  quantity: number;
  orderId?: string;
  notes?: string;
}

export interface TransferInventoryRequest {
  vendorId: string;
  quantity: number;
  pricePerUnit?: number;
  notes?: string;
}

// ========================================
// INVENTORY ITEM TYPES FOR DASHBOARD
// ========================================
// In types/index.ts - Find the InventoryItem interface and add these fields:

export interface InventoryItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    category: string;
    price: number;
    images?: string[];
  };
  supplierId: {
    _id: string;
    companyName: string;
  };
  sku: string;
  quantity: number;
  minimumOrderQuantity: number;
  status: "in-stock" | "low-stock" | "out-of-stock" | "reserved";
  totalValue: number;
  location?: string;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;

  manufactureDate: string | Date;
  expiryDate: string | Date;

  qrCode?: string;
  qrCodeImageUrl?: string;
  qrCodeGenerated?: boolean;
  totalScans?: number;
  ipfsHash?: string;
  qrMetadata?: {
    generatedAt?: string | Date;
    generatedBy?: string;
    ipfsHash?: string;
    cloudinaryUrl?: string;
    trackingUrl?: string;
  };
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  reservedItems: number;
}

// ========================================
// CONSENSUS AND NETWORK TYPES
// ========================================

export interface ConsensusNode {
  id: string;
  name: string;
  type: "peer" | "orderer" | "ca";
  status: "online" | "offline" | "syncing";
  lastSeen: string;
  blockHeight: number;
  version: string;
}

export interface NetworkHealth {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  syncingNodes: number;
  averageBlockTime: number;
  transactionThroughput: number;
  networkLatency: number;
}

// ========================================
// ROLE PRESERVATION UTILITY TYPES
// ========================================

export interface RolePreservationData {
  address: string;
  role: UserRole;
  userData: User;
  timestamp: string;
  networkType: "hyperledger-fabric";
}

export interface WalletMetadata {
  createdAt: string;
  networkType: "hyperledger-fabric";
  organizationMSP: string;
  channelName: string;
}

// ========================================
// FORM TYPES
// ========================================

export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: FormFieldError[];
  isSubmitting: boolean;
  isValid: boolean;
}

export interface ValidationError {
  [key: string]: string;
}

// ========================================
// NOTIFICATION TYPES
// ========================================

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: "primary" | "secondary";
}

// ========================================
// SEARCH AND FILTER TYPES
// ========================================

export interface SearchFilters {
  category?: string;
  subcategory?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  supplier?: string;
  status?: ProductStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  size?: string;
  color?: string;
  brand?: string;
  search?: string;
}

// ========================================
// COMPONENT PROPS TYPES
// ========================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// ========================================
// ROUTE PROTECTION TYPES
// ========================================

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

// ========================================
// CHART AND VISUALIZATION TYPES
// ========================================

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  category?: string;
}

export interface ChartConfig {
  type: "line" | "bar" | "pie" | "area";
  data: ChartDataPoint[];
  xAxisKey: string;
  yAxisKey: string;
  colors?: string[];
}

// ========================================
// FILE UPLOAD TYPES
// ========================================

export interface FileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  multiple: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

// ========================================
// THEME TYPES
// ========================================

export type Theme = "light" | "dark" | "system";

export interface ThemeConfig {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// ========================================
// ERROR TYPES
// ========================================

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// ========================================
// CONFIGURATION TYPES
// ========================================

export interface AppConfig {
  apiUrl: string;
  chainId: number;
  contractAddresses: Record<string, string>;
  ipfsGateway: string;
  enabledFeatures: string[];
  hyperledgerConfig: {
    channelName: string;
    chaincodeName: string;
    organizations: {
      [key: string]: {
        mspId: string;
        peers: string[];
        certificateAuthorities: string[];
      };
    };
  };
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ========================================
// RECOVERY AND BACKUP TYPES
// ========================================

export interface RecoveryPhrase {
  phrase: string;
  walletId: string;
  createdAt: string;
  isBackedUp: boolean;
}

export interface BackupData {
  walletMetadata: WalletMetadata;
  userProfile: User;
  recoveryPhrase: string;
  networkConfig: {
    organizationMSP: string;
    channelName: string;
  };
  createdAt: string;
}

// ========================================
// BUSINESS TYPES FOR SUPPLIERS/VENDORS
// ========================================

export type BusinessType =
  | "manufacturer"
  | "distributor"
  | "ministry"
  | "regulatory"
  | "raw-materials"
  | "retailer"
  | "wholesaler"
  | "reseller"
  | "marketplace"
  | "boutique";

export interface BusinessInfo {
  companyName: string;
  businessAddress: string;
  businessType: BusinessType;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
  phone?: string;
  email?: string;
}

// ========================================
// ORGANIZATION MSP MAPPINGS
// ========================================

export const MSP_MAPPINGS = {
  supplier: "SupplierMSP",
  vendor: "VendorMSP",
  customer: "CustomerMSP",
  "blockchain-expert": "AdminMSP",
} as const;

// ========================================
// VENDOR ANALYTICS TYPES
// ========================================

export type {
  SalesData as VendorSalesData,
  ProductPerformance as VendorProductPerformance,
  CustomerData as VendorCustomerData,
  CategoryData as VendorCategoryData,
  AnalyticsMetrics as VendorAnalyticsMetrics,
  VendorAnalyticsResponse,
} from "@/lib/api/vendor.analytics.api";
