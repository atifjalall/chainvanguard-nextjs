"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  RotateCcw,
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
  Clock,
  AlertCircle,
  CreditCard,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Order } from "@/types";

// Mock sales history data - vendor perspective
const mockSalesHistory: Order[] = [
  {
    id: "ORD-2025-015",
    customerId: "cust-001",
    customerName: "John Smith",
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
  },
  {
    id: "ORD-2025-014",
    customerId: "cust-002",
    customerName: "Sarah Johnson",
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
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-004",
        productName: "Smart Watch Pro Series",
        quantity: 1,
        price: 299.99,
        totalPrice: 299.99,
      },
      {
        productId: "prod-005",
        productName: "Watch Band Leather Premium",
        quantity: 2,
        price: 29.99,
        totalPrice: 59.98,
      },
    ],
    totalAmount: 359.97,
    status: "delivered",
    shippingAddress: {
      street: "789 Pine Road",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-13T16:45:00Z",
    updatedAt: "2025-08-14T18:20:00Z",
    trackingId: "TRK-2025-013",
  },
  {
    id: "ORD-2025-012",
    customerId: "cust-004",
    customerName: "Emily Davis",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-006",
        productName: "Laptop Stand Adjustable Pro",
        quantity: 1,
        price: 79.99,
        totalPrice: 79.99,
      },
      {
        productId: "prod-007",
        productName: "USB-C Hub 7-in-1",
        quantity: 1,
        price: 49.99,
        totalPrice: 49.99,
      },
    ],
    totalAmount: 129.98,
    status: "delivered",
    shippingAddress: {
      street: "321 Elm Street",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-12T12:30:00Z",
    updatedAt: "2025-08-13T09:15:00Z",
    trackingId: "TRK-2025-012",
  },
  {
    id: "ORD-2025-011",
    customerId: "cust-005",
    customerName: "David Wilson",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-008",
        productName: "Mechanical Keyboard RGB",
        quantity: 1,
        price: 159.99,
        totalPrice: 159.99,
      },
    ],
    totalAmount: 159.99,
    status: "cancelled",
    shippingAddress: {
      street: "654 Maple Drive",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-11T08:45:00Z",
    updatedAt: "2025-08-11T10:30:00Z",
    trackingId: undefined,
  },
  {
    id: "ORD-2025-010",
    customerId: "cust-006",
    customerName: "Lisa Anderson",
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
  },
  {
    id: "ORD-2025-009",
    customerId: "cust-007",
    customerName: "Robert Taylor",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-010",
        productName: "Webcam 4K Ultra HD",
        quantity: 1,
        price: 129.99,
        totalPrice: 129.99,
      },
      {
        productId: "prod-011",
        productName: "Microphone USB Professional",
        quantity: 1,
        price: 89.99,
        totalPrice: 89.99,
      },
    ],
    totalAmount: 219.98,
    status: "delivered",
    shippingAddress: {
      street: "555 Tech Street",
      city: "Austin",
      state: "TX",
      zipCode: "73301",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-09T11:15:00Z",
    updatedAt: "2025-08-11T13:30:00Z",
    trackingId: "TRK-2025-009",
  },
];

const statusOptions = ["All Status", "delivered", "shipped", "cancelled", "pending"];
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [paymentFilter, setPaymentFilter] = useState("All Payments");
  const [timeRange, setTimeRange] = useState("30d");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    const filtered = mockSalesHistory.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.products.some((item) =>
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = statusFilter === "All Status" || order.status === statusFilter;
      const matchesPayment = paymentFilter === "All Payments" || order.paymentMethod === paymentFilter;

      // Time range filtering (simplified for demo)
      const matchesTimeRange = true; // In real app, filter by actual date ranges

      return matchesSearch && matchesStatus && matchesPayment && matchesTimeRange;
    });

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
  }, [searchTerm, statusFilter, paymentFilter, timeRange, sortBy]);

  const getStatusConfig = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return {
          color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
          icon: CheckCircle,
          label: "Delivered",
        };
      case "shipped":
        return {
          color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
          icon: Truck,
          label: "Shipped",
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
          icon: Clock,
          label: "Pending",
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
          icon: XCircle,
          label: "Cancelled",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: Package,
          label: "Unknown",
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getPaymentIcon = (paymentMethod: string) => {
    switch (paymentMethod) {
      case "crypto":
        return <Wallet className="h-3 w-3" />;
      case "card":
        return <CreditCard className="h-3 w-3" />;
      default:
        return <DollarSign className="h-3 w-3" />;
    }
  };

  const SalesHistoryCard = ({ order }: { order: Order }) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedOrder === order.id;

    return (
      <Card className="border border-border bg-card hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <StatusIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">{order.id}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={`text-xs px-2 py-1 ${statusConfig.color}`} variant="secondary">
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Customer & Amount */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {order.customerName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(order.totalAmount)}
              </span>
              <div className="flex items-center gap-1 justify-end mt-1">
                {getPaymentIcon(order.paymentMethod)}
                <span className="text-xs text-muted-foreground capitalize">
                  {order.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {order.products.length} item{order.products.length > 1 ? "s" : ""}
              </span>
              {order.trackingId && (
                <span className="text-xs text-muted-foreground font-mono">
                  {order.trackingId}
                </span>
              )}
            </div>

            {/* Status specific info */}
            {order.status === "delivered" && (
              <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                ✓ Successfully delivered and payment received
              </div>
            )}

            {order.status === "shipped" && (
              <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                📦 Order shipped - tracking: {order.trackingId}
              </div>
            )}

            {order.status === "cancelled" && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                ❌ Order cancelled - payment refunded
              </div>
            )}
          </div>

          {/* Items Preview/Details */}
          {!isExpanded ? (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground line-clamp-1">
                {order.products
                  .map((item) => `${item.quantity}x ${item.productName}`)
                  .join(", ")}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-3 border-t border-border pt-3">
              {/* Products */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Products Sold</h4>
                {order.products.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-foreground">{item.productName}</span>
                      <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Customer Info */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">Customer Details</h4>
                <p className="text-xs text-muted-foreground">
                  {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                  {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
              </div>

              {/* Order Timeline */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">Timeline</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Order placed: {formatDate(order.createdAt)}</div>
                  <div>Last updated: {formatDate(order.updatedAt)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-7"
              onClick={() => toggleOrderExpansion(order.id)}
            >
              {isExpanded ? "Show Less" : "View Details"}
            </Button>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="View Order"
              >
                <Eye className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Download Invoice"
              >
                <Download className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Export Details"
              >
                <FileText className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate stats
  const totalSales = filteredAndSortedOrders.length;
  const totalRevenue = filteredAndSortedOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const deliveredOrders = filteredAndSortedOrders.filter((o) => o.status === "delivered").length;
  const uniqueCustomers = new Set(filteredAndSortedOrders.map((o) => o.customerId)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales History</h1>
          <p className="text-muted-foreground">
            Track all your sales transactions and revenue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 border-border bg-background">
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
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Sales Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sales", value: totalSales, icon: Package, color: "text-foreground" },
          {
            label: "Total Revenue",
            value: formatCurrency(totalRevenue),
            icon: DollarSign,
            color: "text-green-600 dark:text-green-400",
          },
          {
            label: "Delivered",
            value: deliveredOrders,
            icon: CheckCircle,
            color: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Customers",
            value: uniqueCustomers,
            icon: Users,
            color: "text-purple-600 dark:text-purple-400",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border border-border bg-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className={`text-lg font-medium ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm border-border bg-background"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-sm border-border bg-background">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status} className="text-sm">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-9 text-sm border-border bg-background">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map((payment) => (
                  <SelectItem key={payment} value={payment} className="text-sm">
                    {payment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 text-sm border-border bg-background">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedOrders.length} of {mockSalesHistory.length} sales
            </p>

            {/* Active Filters */}
            <div className="flex gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                  &quot;{searchTerm}&quot;
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== "All Status" && (
                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                  {statusFilter}
                  <button
                    onClick={() => setStatusFilter("All Status")}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {paymentFilter !== "All Payments" && (
                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                  {paymentFilter}
                  <button
                    onClick={() => setPaymentFilter("All Payments")}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      {filteredAndSortedOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedOrders.map((order) => (
            <SalesHistoryCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 border border-border bg-card">
          <CardContent>
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {totalSales === 0 ? "No Sales Yet" : "No Sales Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {totalSales === 0
                ? "When customers purchase your products, sales will appear here."
                : "Try adjusting your search terms or filters."}
            </p>
            {totalSales === 0 ? (
              <Button onClick={() => window.open("/vendor/my-products", "_self")}>
                <Package className="h-4 w-4 mr-2" />
                Add Products to Start Selling
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All Status");
                  setPaymentFilter("All Payments");
                }}
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {filteredAndSortedOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Breakdown */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed Sales</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(
                      filteredAndSortedOrders
                        .filter((o) => o.status === "delivered")
                        .reduce((sum, o) => sum + o.totalAmount, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Revenue</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(
                      filteredAndSortedOrders
                        .filter((o) => o.status === "shipped")
                        .reduce((sum, o) => sum + o.totalAmount, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cancelled Orders</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(
                      filteredAndSortedOrders
                        .filter((o) => o.status === "cancelled")
                        .reduce((sum, o) => sum + o.totalAmount, 0)
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">Total Revenue</span>
                    <span className="font-bold text-lg text-foreground">
                      {formatCurrency(totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(
                  filteredAndSortedOrders
                    .flatMap((order) => order.products)
                    .reduce((acc, product) => {
                      const key = product.productName;
                      if (!acc.has(key)) {
                        acc.set(key, { name: key, quantity: 0, revenue: 0 });
                      }
                      const existing = acc.get(key)!;
                      existing.quantity += product.quantity;
                      existing.revenue += product.totalPrice;
                      return acc;
                    }, new Map())
                    .values()
                )
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 3)
                  .map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantity} sold
                        </p>
                      </div>
                      <span className="font-medium text-foreground">
                        {formatCurrency(product.revenue)}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Order Value</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(
                      totalRevenue / Math.max(filteredAndSortedOrders.length, 1)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {(
                      (deliveredOrders / Math.max(filteredAndSortedOrders.length, 1)) *
                      100
                    ).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cancellation Rate</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {(
                      (filteredAndSortedOrders.filter((o) => o.status === "cancelled").length /
                        Math.max(filteredAndSortedOrders.length, 1)) *
                      100
                    ).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Return Customers</span>
                  <span className="font-medium text-foreground">
                    {Math.round(
                      ((filteredAndSortedOrders.length - uniqueCustomers) /
                        Math.max(uniqueCustomers, 1)) *
                        100
                    )}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription className="text-muted-foreground">
            Common actions related to your sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <Download className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Export Sales Report</div>
                <div className="text-xs text-muted-foreground">Download detailed report</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <Users className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">View Customers</div>
                <div className="text-xs text-muted-foreground">Manage relationships</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <Package className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Product Performance</div>
                <div className="text-xs text-muted-foreground">Analyze top sellers</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <TrendingUp className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">View Analytics</div>
                <div className="text-xs text-muted-foreground">Detailed insights</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}