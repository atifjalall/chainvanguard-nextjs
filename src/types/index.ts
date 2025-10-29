import { Transaction, WalletData } from "./web3";

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
  // Hyperledger specific
  networkType: "hyperledger-fabric";
  organizationMSP: string;
  isAuthenticated: boolean;
  createdAt: string;
  updatedAt: string;
  loginAt?: string;
  avatar?: string;
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

  // Status
  status:
    | "draft"
    | "active"
    | "inactive"
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
// BLOCKCHAIN TYPES
// ========================================

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
  courierName?: "FedEx" | "UPS" | "DHL" | "USPS" | "Local" | "Other" | "";
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
}

export interface OrderItem {
  _id?: string;
  productId: string;
  productName: string;
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

export type PaymentMethod = "crypto" | "card" | "bank-transfer" | "wallet";

// ========================================
// CART TYPES
// ========================================

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  addedAt: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedFit?: string;
  price: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt: string;
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
