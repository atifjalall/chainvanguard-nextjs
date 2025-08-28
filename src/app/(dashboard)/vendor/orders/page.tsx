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
  Sparkles,
  Shield,
  Activity,
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
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
          color:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
          icon: Clock,
          label: "Pending",
        };
      case "confirmed":
        return {
          color:
            "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
          icon: CheckCircle,
          label: "Confirmed",
        };
      case "shipped":
        return {
          color:
            "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
          icon: Truck,
          label: "Shipped",
        };
      case "delivered":
        return {
          color:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
          icon: CheckCircle,
          label: "Delivered",
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
      <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 rounded-lg" />
        <CardContent className="relative z-10 p-6">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center shadow-lg">
                <StatusIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {order.id}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                className={`${statusConfig.color} flex items-center gap-1`}
                variant="secondary"
              >
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Customer Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {order.customerName}
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Customer
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${order.totalAmount.toFixed(2)}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {order.products.length} item
                {order.products.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                Order Progress
              </span>
              <span className="text-gray-900 dark:text-gray-100 font-bold">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Order Summary */}
          {!isExpanded ? (
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                {order.products
                  .map((item) => `${item.quantity}x ${item.productName}`)
                  .join(", ")}
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              {/* Products */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products
                </h4>
                {order.products.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {item.productName}
                        </span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity} @ ${item.price}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      ${item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Shipping Address
                </h4>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatAddress(order.shippingAddress)}
                  </p>
                </div>
              </div>

              {/* Tracking Info */}
              {order.trackingId && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Tracking Information
                  </h4>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                      {order.trackingId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleOrderExpansion(order.id)}
              className="text-sm"
            >
              {isExpanded ? "Show Less" : "View Details"}
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <MessageCircle className="h-4 w-4" />
              </Button>

              {order.status !== "delivered" && order.status !== "cancelled" && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(order)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
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
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-sm"></div>
        </div>
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
              Order Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Manage customer orders and track fulfillment
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <Package className="h-3 w-3 mr-1" />
                {totalOrders} Orders
              </Badge>
              <Badge variant="outline" className="border-gray-300">
                <Shield className="h-3 w-3 mr-1" />
                Blockchain Secured
              </Badge>
              {totalRevenue > 0 && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  <DollarSign className="h-3 w-3 mr-1" />$
                  {totalRevenue.toFixed(0)} Revenue
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              title: "Total Orders",
              value: totalOrders,
              subtitle: "All time",
              icon: Package,
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
            },
            {
              title: "Pending",
              value: pendingOrders,
              subtitle: "Need attention",
              icon: Clock,
              gradient: "from-yellow-500 to-orange-500",
              bgGradient: "from-yellow-500/5 via-transparent to-orange-500/5",
            },
            {
              title: "Active",
              value: activeOrders,
              subtitle: "In progress",
              icon: Truck,
              gradient: "from-green-500 to-emerald-500",
              bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
            },
            {
              title: "Completed",
              value: completedOrders,
              subtitle: "Delivered",
              icon: CheckCircle,
              gradient: "from-emerald-500 to-teal-500",
              bgGradient: "from-emerald-500/5 via-transparent to-teal-500/5",
            },
            {
              title: "Revenue",
              value: `$${totalRevenue.toFixed(0)}`,
              subtitle: "From completed",
              icon: DollarSign,
              gradient: "from-purple-500 to-indigo-500",
              bgGradient: "from-purple-500/5 via-transparent to-indigo-500/5",
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

      {/* Tab Navigation & Filters */}
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
                <Filter className="h-4 w-4 text-white" />
              </div>
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter and search through your orders
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
                variant={selectedTab === "active" ? "default" : "ghost"}
                size="sm"
                className={`h-9 text-sm ${
                  selectedTab === "active"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setSelectedTab("active")}
              >
                <Truck className="h-4 w-4 mr-1" />
                Active ({activeOrders})
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders, customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
                {filteredAndSortedOrders.length} of {totalOrders} orders
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
                {selectedStatus !== "All Status" && (
                  <Badge variant="outline" className="text-xs">
                    {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus("All Status")}
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
          <div className="space-y-6">
            {filteredAndSortedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-16 border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 via-transparent to-slate-500/5 rounded-lg" />
            <CardContent className="relative z-10">
              <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                <Package className="h-10 w-10 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {totalOrders === 0 ? "No Orders Yet" : "No Orders Found"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {totalOrders === 0
                  ? "When customers place orders, they will appear here."
                  : "Try adjusting your search terms or filters."}
              </p>
              {totalOrders === 0 ? (
                <Button
                  onClick={() => window.open("/vendor/my-products", "_self")}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
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
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              Update Order Status
            </DialogTitle>
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
                <SelectTrigger className="mt-1">
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
                  className="mt-1"
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
                className="mt-1"
              />
            </div>

            {updatingOrder && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Customer:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {updatingOrder.customerName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Order Total:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ${updatingOrder.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Current Status:
                  </span>
                  <Badge
                    className={`${getStatusConfig(updatingOrder.status).color} text-xs`}
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
            <Button
              onClick={saveStatusUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
