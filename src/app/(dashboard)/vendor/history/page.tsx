"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/_ui/card";
import { Button } from "@/components/_ui/button";
import { Input } from "@/components/_ui/input";
import { Badge } from "@/components/_ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/_ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/_ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/_ui/dialog";
import { Label } from "@/components/_ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/_ui/tabs";
import {
  Search,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Star,
  Filter,
  TrendingUp,
  ArrowUpDown,
  DollarSign,
  Users,
  Truck,
  Eye,
  FileText,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Wallet,
  MapPin,
  Phone,
  Mail,
  Grid3X3,
  List,
  SlidersHorizontal,
  Sparkles,
  Shield,
  Crown,
  Activity,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

// Order interface
interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  vendorId: string;
  vendorName: string;
  products: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: "crypto" | "card";
  createdAt: string;
  updatedAt: string;
  trackingId: string;
  rating?: number;
  notes?: string;
}

// Mock sales history data
const mockSalesHistory: Order[] = [
  {
    id: "ORD-2025-015",
    customerId: "cust-001",
    customerName: "John Smith",
    customerEmail: "john.smith@email.com",
    customerPhone: "+1 (555) 123-4567",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-001",
        productName: "Wireless Gaming Mouse",
        quantity: 2,
        price: 89.99,
        totalPrice: 179.98,
      },
      {
        productId: "prod-002",
        productName: "Gaming Mousepad Pro",
        quantity: 1,
        price: 34.99,
        totalPrice: 34.99,
      },
    ],
    totalAmount: 214.97,
    status: "delivered",
    shippingAddress: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-15T10:30:00Z",
    updatedAt: "2025-08-16T14:20:00Z",
    trackingId: "TRK-2025-015",
    rating: 5,
    notes: "Fast delivery, excellent quality!",
  },
  {
    id: "ORD-2025-014",
    customerId: "cust-002",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.j@email.com",
    customerPhone: "+1 (555) 987-6543",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-003",
        productName: "Bluetooth Headphones Premium",
        quantity: 1,
        price: 199.99,
        totalPrice: 199.99,
      },
    ],
    totalAmount: 199.99,
    status: "shipped",
    shippingAddress: {
      street: "456 Oak Avenue",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-14T09:15:00Z",
    updatedAt: "2025-08-15T11:30:00Z",
    trackingId: "TRK-2025-014",
  },
  {
    id: "ORD-2025-013",
    customerId: "cust-003",
    customerName: "Mike Chen",
    customerEmail: "mike.chen@email.com",
    customerPhone: "+1 (555) 456-7890",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-004",
        productName: "4K Webcam Ultra HD",
        quantity: 1,
        price: 149.99,
        totalPrice: 149.99,
      },
      {
        productId: "prod-005",
        productName: "USB-C Hub",
        quantity: 2,
        price: 49.99,
        totalPrice: 99.98,
      },
    ],
    totalAmount: 249.97,
    status: "confirmed",
    shippingAddress: {
      street: "789 Tech Boulevard",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-13T16:45:00Z",
    updatedAt: "2025-08-14T10:20:00Z",
    trackingId: "TRK-2025-013",
  },
  {
    id: "ORD-2025-012",
    customerId: "cust-004",
    customerName: "Emily Davis",
    customerEmail: "emily.davis@email.com",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-006",
        productName: "Smart Watch Pro",
        quantity: 1,
        price: 299.99,
        totalPrice: 299.99,
      },
    ],
    totalAmount: 299.99,
    status: "delivered",
    shippingAddress: {
      street: "321 Pine Street",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-12T08:30:00Z",
    updatedAt: "2025-08-14T17:15:00Z",
    trackingId: "TRK-2025-012",
    rating: 4,
  },
  {
    id: "ORD-2025-011",
    customerId: "cust-005",
    customerName: "David Wilson",
    customerEmail: "david.w@email.com",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-007",
        productName: "Wireless Keyboard",
        quantity: 1,
        price: 79.99,
        totalPrice: 79.99,
      },
      {
        productId: "prod-008",
        productName: "Ergonomic Mouse",
        quantity: 1,
        price: 59.99,
        totalPrice: 59.99,
      },
    ],
    totalAmount: 139.98,
    status: "cancelled",
    shippingAddress: {
      street: "654 Market Street",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-11T12:00:00Z",
    updatedAt: "2025-08-12T09:45:00Z",
    trackingId: "TRK-2025-011",
  },
  {
    id: "ORD-2025-010",
    customerId: "cust-006",
    customerName: "Lisa Anderson",
    customerEmail: "lisa.anderson@email.com",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-009",
        productName: "Wireless Charger Fast",
        quantity: 3,
        price: 39.99,
        totalPrice: 119.97,
      },
    ],
    totalAmount: 119.97,
    status: "delivered",
    shippingAddress: {
      street: "987 Broadway",
      city: "Boston",
      state: "MA",
      zipCode: "02101",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-10T14:20:00Z",
    updatedAt: "2025-08-12T16:45:00Z",
    trackingId: "TRK-2025-010",
    rating: 5,
  },
];

const statusOptions = [
  "All Status",
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];
const paymentOptions = ["All Payments", "crypto", "card"];
const sortOptions = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "amount-desc", label: "Highest Amount" },
  { value: "amount-asc", label: "Lowest Amount" },
  { value: "customer", label: "Customer Name" },
  { value: "status", label: "Status" },
];

const timeRangeOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 3 Months" },
  { value: "1y", label: "Last Year" },
  { value: "all", label: "All Time" },
];

export default function VendorSalesHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(mockSalesHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [paymentFilter, setPaymentFilter] = useState("All Payments");
  const [sortBy, setSortBy] = useState("date-desc");
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedTab, setSelectedTab] = useState<
    "all" | "delivered" | "shipped" | "pending" | "cancelled"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadOrders();
  }, [user?.id, timeRange]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In real app: const orders = await fetchVendorOrders(user.id, timeRange);
      setOrders(mockSalesHistory);
    } catch (error) {
      toast.error("Failed to load order history");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.products.some((product) =>
          product.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "All Status" || order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "All Payments" ||
        order.paymentMethod === paymentFilter;

      const matchesTab = selectedTab === "all" || order.status === selectedTab;

      return matchesSearch && matchesStatus && matchesPayment && matchesTab;
    });

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "date-asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "amount-desc":
          return b.totalAmount - a.totalAmount;
        case "amount-asc":
          return a.totalAmount - b.totalAmount;
        case "customer":
          return a.customerName.localeCompare(b.customerName);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, paymentFilter, sortBy, selectedTab]);

  const getStatusConfig = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return {
          color:
            "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
          icon: CheckCircle,
          label: "Delivered",
        };
      case "shipped":
        return {
          color:
            "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
          icon: Truck,
          label: "Shipped",
        };
      case "confirmed":
        return {
          color:
            "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
          icon: CheckCircle,
          label: "Confirmed",
        };
      case "pending":
        return {
          color:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
          icon: Clock,
          label: "Pending",
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
          icon: XCircle,
          label: "Cancelled",
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: Clock,
          label: "Unknown",
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedOrders.has(order.id);
    const daysSinceOrder = Math.floor(
      (new Date().getTime() - new Date(order.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-lg" />
        <CardContent className="relative z-10 p-6">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-lg">
                  <AvatarImage src="" alt={order.customerName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
                    {getInitials(order.customerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-1">
                  <StatusIcon className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {order.id}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {order.customerName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {daysSinceOrder === 0 ? "Today" : `${daysSinceOrder}d ago`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(order.totalAmount)}
              </p>
              <Badge
                className={`${statusConfig.color} flex items-center gap-1 w-fit ml-auto`}
              >
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Items:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {order.products.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Payment:</span>
              <div className="flex items-center gap-1">
                {order.paymentMethod === "crypto" ? (
                  <Wallet className="h-3 w-3 text-blue-500" />
                ) : (
                  <CreditCard className="h-3 w-3 text-gray-500" />
                )}
                <span className="text-gray-900 dark:text-gray-100 capitalize">
                  {order.paymentMethod}
                </span>
              </div>
            </div>
            {order.rating && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Rating:
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {order.rating}/5
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Products Preview */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 font-medium">
              Products ({order.products.length})
            </p>
            <div className="space-y-1">
              {order.products
                .slice(0, isExpanded ? order.products.length : 2)
                .map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">
                      {product.quantity}x {product.productName}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {formatCurrency(product.totalPrice)}
                    </span>
                  </div>
                ))}
              {order.products.length > 2 && !isExpanded && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  +{order.products.length - 2} more items
                </p>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 font-medium">
                  Customer Contact
                </p>
                <div className="space-y-1">
                  {order.customerEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {order.customerEmail}
                      </span>
                    </div>
                  )}
                  {order.customerPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {order.customerPhone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 font-medium">
                  Shipping Address
                </p>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-gray-500 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {order.shippingAddress.street}, {order.shippingAddress.city}
                    ,{order.shippingAddress.state}{" "}
                    {order.shippingAddress.zipCode},
                    {order.shippingAddress.country}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 font-medium">
                  Order Timeline
                </p>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div>Created: {formatDate(order.createdAt)}</div>
                  <div>Updated: {formatDate(order.updatedAt)}</div>
                  <div>Tracking: {order.trackingId}</div>
                </div>
              </div>

              {order.notes && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 font-medium">
                    Customer Notes
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    &quot;{order.notes}&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleOrderExpansion(order.id)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {isExpanded ? "Show Less" : "View Details"}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleViewDetails(order)}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Download className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <FileText className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const OrderListItem = ({ order }: { order: Order }) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const daysSinceOrder = Math.floor(
      (new Date().getTime() - new Date(order.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
      <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 rounded-lg" />
        <CardContent className="relative z-10 p-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-14 w-14 border-2 border-white dark:border-gray-800 shadow-lg">
                <AvatarImage src="" alt={order.customerName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
                  {getInitials(order.customerName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-1">
                <StatusIcon className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Order Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {order.id}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {order.products.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )}{" "}
                      items
                    </p>
                  </div>
                  <Badge
                    className={`${statusConfig.color} flex items-center gap-1`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 truncate">
                    {order.products[0].productName}
                    {order.products.length > 1 &&
                      ` +${order.products.length - 1} more`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {order.trackingId}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {order.paymentMethod === "crypto" ? (
                      <Wallet className="h-3 w-3 text-blue-500" />
                    ) : (
                      <CreditCard className="h-3 w-3 text-gray-500" />
                    )}
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {order.paymentMethod}
                    </span>
                  </div>
                  {order.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {order.rating}/5
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {daysSinceOrder === 0 ? "Today" : `${daysSinceOrder}d ago`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDate(order.createdAt).split(",")[0]}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleViewDetails(order)}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Download className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-sm"></div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalSales = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const uniqueCustomers = new Set(orders.map((o) => o.customerId)).size;
  const averageOrderValue = totalRevenue / (totalSales > 0 ? totalSales : 1);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Sales History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Track all your sales transactions and revenue
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <DollarSign className="h-3 w-3 mr-1" />
                {formatCurrency(totalRevenue)}
              </Badge>
              <Badge variant="outline" className="border-gray-300">
                <Shield className="h-3 w-3 mr-1" />
                Blockchain Secured
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <ShoppingCart className="h-3 w-3 mr-1" />
                {totalSales} Orders
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className={`h-8 w-8 p-0 ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className={`h-8 w-8 p-0 ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadOrders}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`transform transition-all duration-700 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              title: "Total Sales",
              value: totalSales,
              subtitle: "All time orders",
              icon: ShoppingCart,
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
            },
            {
              title: "Total Revenue",
              value: formatCurrency(totalRevenue),
              subtitle: "Gross earnings",
              icon: DollarSign,
              gradient: "from-green-500 to-emerald-500",
              bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
            },
            {
              title: "Delivered",
              value: deliveredOrders,
              subtitle: "Completed orders",
              icon: CheckCircle,
              gradient: "from-purple-500 to-indigo-500",
              bgGradient: "from-purple-500/5 via-transparent to-indigo-500/5",
            },
            {
              title: "Pending",
              value: pendingOrders,
              subtitle: "Awaiting processing",
              icon: Clock,
              gradient: "from-orange-500 to-amber-500",
              bgGradient: "from-orange-500/5 via-transparent to-amber-500/5",
            },
            {
              title: "Unique Customers",
              value: uniqueCustomers,
              subtitle: "Different buyers",
              icon: Users,
              gradient: "from-pink-500 to-rose-500",
              bgGradient: "from-pink-500/5 via-transparent to-rose-500/5",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient}`}
                />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`h-10 w-10 rounded-full bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filters and Controls */}
      <div
        className={`transform transition-all duration-700 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5 rounded-lg" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                <SlidersHorizontal className="h-4 w-4 text-white" />
              </div>
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter and search through your order history
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 w-fit bg-white/50 dark:bg-gray-900/50 backdrop-blur">
              <Button
                variant={selectedTab === "all" ? "default" : "ghost"}
                size="sm"
                className={`h-9 text-sm ${
                  selectedTab === "all"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setSelectedTab("all")}
              >
                All Orders
              </Button>
              <Button
                variant={selectedTab === "delivered" ? "default" : "ghost"}
                size="sm"
                className={`h-9 text-sm ${
                  selectedTab === "delivered"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setSelectedTab("delivered")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Delivered ({deliveredOrders})
              </Button>
              <Button
                variant={selectedTab === "shipped" ? "default" : "ghost"}
                size="sm"
                className={`h-9 text-sm ${
                  selectedTab === "shipped"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setSelectedTab("shipped")}
              >
                <Truck className="h-4 w-4 mr-1" />
                Shipped
              </Button>
              <Button
                variant={selectedTab === "pending" ? "default" : "ghost"}
                size="sm"
                className={`h-9 text-sm ${
                  selectedTab === "pending"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setSelectedTab("pending")}
              >
                <Clock className="h-4 w-4 mr-1" />
                Pending ({pendingOrders})
              </Button>
              <Button
                variant={selectedTab === "cancelled" ? "default" : "ghost"}
                size="sm"
                className={`h-9 text-sm ${
                  selectedTab === "cancelled"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setSelectedTab("cancelled")}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancelled
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders, customers, products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  {paymentOptions.map((payment) => (
                    <SelectItem key={payment} value={payment}>
                      {payment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results and Active Filters */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredAndSortedOrders.length} of {totalSales} orders
              </p>

              <div className="flex gap-2">
                {searchTerm && (
                  <Badge variant="outline" className="text-xs">
                    &quot;{searchTerm}&quot;
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 text-gray-600 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {statusFilter !== "All Status" && (
                  <Badge variant="outline" className="text-xs">
                    {statusFilter}
                    <button
                      onClick={() => setStatusFilter("All Status")}
                      className="ml-1 text-gray-600 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {paymentFilter !== "All Payments" && (
                  <Badge variant="outline" className="text-xs">
                    {paymentFilter}
                    <button
                      onClick={() => setPaymentFilter("All Payments")}
                      className="ml-1 text-gray-600 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div
        className={`transform transition-all duration-700 delay-600 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {filteredAndSortedOrders.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                : "space-y-6"
            }
          >
            {filteredAndSortedOrders.map((order) =>
              viewMode === "grid" ? (
                <OrderCard key={order.id} order={order} />
              ) : (
                <OrderListItem key={order.id} order={order} />
              )
            )}
          </div>
        ) : (
          <Card className="text-center py-16 border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 via-transparent to-slate-500/5 rounded-lg" />
            <CardContent className="relative z-10">
              <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {totalSales === 0 ? "No Orders Yet" : "No Orders Found"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {totalSales === 0
                  ? "When customers place orders, they will appear here."
                  : "Try adjusting your search terms or filters."}
              </p>
              {totalSales === 0 ? (
                <Button
                  onClick={() => window.open("/vendor/my-products", "_self")}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Add Products
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All Status");
                    setPaymentFilter("All Payments");
                    setSelectedTab("all");
                  }}
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Eye className="h-4 w-4 text-white" />
              </div>
              Order Details
            </DialogTitle>
            <DialogDescription>
              Complete order information and transaction history
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                  <AvatarImage src="" alt={selectedOrder.customerName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-lg font-bold">
                    {getInitials(selectedOrder.customerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedOrder.id}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedOrder.customerName}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      className={`text-xs ${getStatusConfig(selectedOrder.status).color}`}
                    >
                      {getStatusConfig(selectedOrder.status).label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedOrder.trackingId}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedOrder.products.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}{" "}
                    items
                  </p>
                </div>
              </div>

              <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="customer">Customer</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Ordered Items
                    </Label>
                    <div className="mt-2 space-y-3">
                      {selectedOrder.products.map((product, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {product.productName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Qty: {product.quantity} ×{" "}
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(product.totalPrice)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="customer" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Contact Information
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedOrder.customerEmail || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedOrder.customerPhone || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Order History
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Orders:
                          </span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {
                              orders.filter(
                                (o) => o.customerId === selectedOrder.customerId
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Total Spent:
                          </span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {formatCurrency(
                              orders
                                .filter(
                                  (o) =>
                                    o.customerId === selectedOrder.customerId
                                )
                                .reduce((sum, o) => sum + o.totalAmount, 0)
                            )}
                          </span>
                        </div>
                        {selectedOrder.rating && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Rating:
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-gray-900 dark:text-gray-100">
                                {selectedOrder.rating}/5
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Customer Notes
                      </Label>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          &quot;{selectedOrder.notes}&quot;
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="shipping" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Shipping Address
                    </Label>
                    <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedOrder.customerName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedOrder.shippingAddress.street}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedOrder.shippingAddress.city},{" "}
                            {selectedOrder.shippingAddress.state}{" "}
                            {selectedOrder.shippingAddress.zipCode}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedOrder.shippingAddress.country}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Tracking Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Tracking ID:
                        </span>
                        <span className="text-gray-900 dark:text-gray-100 font-mono">
                          {selectedOrder.trackingId}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Status:
                        </span>
                        <Badge
                          className={`${getStatusConfig(selectedOrder.status).color}`}
                        >
                          {getStatusConfig(selectedOrder.status).label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="payment" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Payment Details
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Payment Method:
                        </span>
                        <div className="flex items-center gap-1">
                          {selectedOrder.paymentMethod === "crypto" ? (
                            <Wallet className="h-4 w-4 text-blue-500" />
                          ) : (
                            <CreditCard className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-gray-900 dark:text-gray-100 capitalize">
                            {selectedOrder.paymentMethod}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Subtotal:
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-gray-900 dark:text-gray-100">
                          Total:
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Transaction Timeline
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Order Created:
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatDate(selectedOrder.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Last Updated:
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatDate(selectedOrder.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
