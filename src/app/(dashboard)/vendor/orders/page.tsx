"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  MessageCircle,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Filter,
  Download,
  RefreshCw,
  Phone,
  Mail,
  Home,
  Star,
  TrendingUp,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Order } from "@/types";
import { toast } from "sonner";

// Mock orders data - in real app this would come from blockchain/database
const mockOrders: Order[] = [
  {
    id: "ORD-2025-001",
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
        productName: "Gaming Mousepad",
        quantity: 1,
        price: 24.99,
        totalPrice: 24.99,
      },
    ],
    totalAmount: 204.97,
    status: "pending",
    shippingAddress: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-16T10:30:00Z",
    updatedAt: "2025-08-16T10:30:00Z",
    trackingId: undefined,
  },
  {
    id: "ORD-2025-002",
    customerId: "cust-002",
    customerName: "Sarah Johnson",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-003",
        productName: "Bluetooth Headphones",
        quantity: 1,
        price: 199.99,
        totalPrice: 199.99,
      },
    ],
    totalAmount: 199.99,
    status: "confirmed",
    shippingAddress: {
      street: "456 Oak Avenue",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-15T14:20:00Z",
    updatedAt: "2025-08-15T16:45:00Z",
    trackingId: "TRK-2025-002",
  },
  {
    id: "ORD-2025-003",
    customerId: "cust-003",
    customerName: "Mike Chen",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-004",
        productName: "Smart Watch Pro",
        quantity: 1,
        price: 299.99,
        totalPrice: 299.99,
      },
      {
        productId: "prod-005",
        productName: "Watch Band Leather",
        quantity: 2,
        price: 29.99,
        totalPrice: 59.98,
      },
    ],
    totalAmount: 359.97,
    status: "shipped",
    shippingAddress: {
      street: "789 Pine Road",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-14T09:15:00Z",
    updatedAt: "2025-08-15T11:30:00Z",
    trackingId: "TRK-2025-003",
  },
  {
    id: "ORD-2025-004",
    customerId: "cust-004",
    customerName: "Emily Davis",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-006",
        productName: "Laptop Stand Adjustable",
        quantity: 1,
        price: 79.99,
        totalPrice: 79.99,
      },
    ],
    totalAmount: 79.99,
    status: "delivered",
    shippingAddress: {
      street: "321 Elm Street",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-13T16:45:00Z",
    updatedAt: "2025-08-14T18:20:00Z",
    trackingId: "TRK-2025-004",
  },
  {
    id: "ORD-2025-005",
    customerId: "cust-005",
    customerName: "David Wilson",
    vendorId: "vendor-001",
    vendorName: "Tech Solutions Inc.",
    products: [
      {
        productId: "prod-007",
        productName: "USB-C Hub Multiport",
        quantity: 3,
        price: 49.99,
        totalPrice: 149.97,
      },
    ],
    totalAmount: 149.97,
    status: "cancelled",
    shippingAddress: {
      street: "654 Maple Drive",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "USA",
    },
    paymentMethod: "crypto",
    createdAt: "2025-08-12T12:30:00Z",
    updatedAt: "2025-08-13T09:15:00Z",
    trackingId: undefined,
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

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount-desc", label: "Highest Amount" },
  { value: "amount-asc", label: "Lowest Amount" },
  { value: "status", label: "Status" },
];

export default function VendorOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "active">(
    "all"
  );
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<Order["status"]>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    // In real app, load orders from API/blockchain
    loadOrders();
  }, [user?.id]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In real app: const orders = await fetchVendorOrders(user.id);
      setOrders(mockOrders.filter((order) => order.vendorId === user?.id));
    } catch (error) {
      toast.error("Failed to load orders");
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
        order.products.some((p) =>
          p.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        selectedStatus === "All Status" || order.status === selectedStatus;

      const matchesTab =
        selectedTab === "all" ||
        (selectedTab === "pending" && order.status === "pending") ||
        (selectedTab === "active" &&
          ["confirmed", "shipped"].includes(order.status));

      return matchesSearch && matchesStatus && matchesTab;
    });

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "amount-desc":
          return b.totalAmount - a.totalAmount;
        case "amount-asc":
          return a.totalAmount - b.totalAmount;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, searchTerm, selectedStatus, sortBy, selectedTab]);

  const getStatusConfig = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-700",
          icon: Clock,
          label: "Pending",
        };
      case "confirmed":
        return {
          color: "bg-blue-100 text-blue-700",
          icon: CheckCircle,
          label: "Confirmed",
        };
      case "shipped":
        return {
          color: "bg-green-100 text-green-700",
          icon: Truck,
          label: "Shipped",
        };
      case "delivered":
        return {
          color: "bg-gray-100 text-gray-700",
          icon: CheckCircle,
          label: "Delivered",
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-700",
          icon: XCircle,
          label: "Cancelled",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700",
          icon: Package,
          label: "Unknown",
        };
    }
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

  const formatAddress = (address: Order["shippingAddress"]) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  const handleUpdateStatus = (order: Order) => {
    setUpdatingOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingId || "");
    setStatusNote("");
    setIsUpdateStatusOpen(true);
  };

  const saveStatusUpdate = () => {
    if (!updatingOrder) return;

    const updatedOrders = orders.map((order) =>
      order.id === updatingOrder.id
        ? {
            ...order,
            status: newStatus,
            trackingId: trackingNumber || order.trackingId,
            updatedAt: new Date().toISOString(),
          }
        : order
    );

    setOrders(updatedOrders);
    setIsUpdateStatusOpen(false);
    setUpdatingOrder(null);
    toast.success(`Order ${updatingOrder.id} status updated to ${newStatus}`);

    // In real app: updateOrderStatus(updatingOrder.id, newStatus, trackingNumber, statusNote);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getOrderProgress = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return 10;
      case "confirmed":
        return 30;
      case "shipped":
        return 70;
      case "delivered":
        return 100;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedOrder === order.id;
    const progress = getOrderProgress(order.status);

    return (
      <Card className="border-border bg-card hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <StatusIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-card-foreground">
                  {order.id}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs px-2 py-1 ${statusConfig.color}`}
                variant="secondary"
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Customer Info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-card-foreground">
                {order.customerName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-card-foreground">
                ${order.totalAmount.toFixed(2)}
              </span>
              <p className="text-xs text-muted-foreground">
                {order.products.length} item
                {order.products.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-muted-foreground">Order Progress</span>
              <span className="text-card-foreground font-medium">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Order Summary */}
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
                <h4 className="text-sm font-medium text-card-foreground">
                  Products
                </h4>
                {order.products.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-card-foreground">
                        {item.productName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-card-foreground">
                      ${item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-card-foreground flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  Shipping Address
                </h4>
                <p className="text-xs text-muted-foreground">
                  {formatAddress(order.shippingAddress)}
                </p>
              </div>

              {/* Tracking Info */}
              {order.trackingId && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-card-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Tracking
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    {order.trackingId}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-card-foreground h-7"
              onClick={() => toggleOrderExpansion(order.id)}
            >
              {isExpanded ? "Show Less" : "View Details"}
            </Button>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-card-foreground"
                title="View Order"
              >
                <Eye className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-card-foreground"
                title="Contact Customer"
              >
                <MessageCircle className="h-3 w-3" />
              </Button>

              {order.status !== "delivered" && order.status !== "cancelled" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={() => handleUpdateStatus(order)}
                >
                  Update Status
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const activeOrders = orders.filter((o) =>
    ["confirmed", "shipped"].includes(o.status)
  ).length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">
            Manage customer orders and track fulfillment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeOrders}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedOrders}
            </div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              From completed orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border border-border rounded-md p-0.5 w-fit">
        <Button
          variant={selectedTab === "all" ? "default" : "ghost"}
          size="sm"
          className={`h-7 text-xs ${
            selectedTab === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-card-foreground"
          }`}
          onClick={() => setSelectedTab("all")}
        >
          All Orders
        </Button>
        <Button
          variant={selectedTab === "pending" ? "default" : "ghost"}
          size="sm"
          className={`h-7 text-xs ${
            selectedTab === "pending"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-card-foreground"
          }`}
          onClick={() => setSelectedTab("pending")}
        >
          <Clock className="h-3 w-3 mr-1" />
          Pending ({pendingOrders})
        </Button>
        <Button
          variant={selectedTab === "active" ? "default" : "ghost"}
          size="sm"
          className={`h-7 text-xs ${
            selectedTab === "active"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-card-foreground"
          }`}
          onClick={() => setSelectedTab("active")}
        >
          <Truck className="h-3 w-3 mr-1" />
          Active ({activeOrders})
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>

            {/* Status filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status} className="text-sm">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-sm"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedOrders.length} of {totalOrders} orders
            </p>

            {/* Active filters */}
            <div className="flex gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  &quot;{searchTerm}&quot;
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedStatus !== "All Status" && (
                <Badge variant="secondary" className="text-xs">
                  {selectedStatus}
                  <button
                    onClick={() => setSelectedStatus("All Status")}
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

      {/* Orders List */}
      {filteredAndSortedOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 border-border bg-card">
          <CardContent>
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">
              {totalOrders === 0 ? "No Orders Yet" : "No Orders Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {totalOrders === 0
                ? "When customers place orders, they will appear here."
                : "Try adjusting your search terms or filters."}
            </p>
            {totalOrders === 0 ? (
              <Button
                onClick={() => window.open("/vendor/my-products", "_self")}
              >
                <Package className="h-4 w-4 mr-2" />
                Manage Products
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("All Status");
                  setSelectedTab("all");
                }}
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status of order {updatingOrder?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value: Order["status"]) => setNewStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newStatus === "shipped" || newStatus === "delivered") && (
              <div>
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>
            )}

            <div>
              <Label htmlFor="note">Status Note (Optional)</Label>
              <Textarea
                id="note"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add a note about this status update..."
                rows={3}
              />
            </div>

            {updatingOrder && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium text-card-foreground">
                    {updatingOrder.customerName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-medium text-card-foreground">
                    ${updatingOrder.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Current Status:</span>
                  <Badge
                    className={`text-xs ${getStatusConfig(updatingOrder.status).color}`}
                  >
                    {getStatusConfig(updatingOrder.status).label}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateStatusOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
