/* eslint-disable @typescript-eslint/no-explicit-any */
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
  XCircle,
  Eye,
  MessageCircle,
  MapPin,
  User,
  DollarSign,
  Filter,
  Download,
  RefreshCw,
  Home,
  Shield,
  Activity,
  TrendingUp,
  ArrowUpDown,
  Loader2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Order, OrderStatus } from "@/types";
import { toast } from "sonner";
import { orderApi, OrderFilters } from "@/lib/api/order.api";

const statusOptions: Array<OrderStatus | "All Status"> = [
  "All Status",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const sortOptions = [
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
  { value: "totalAmount-desc", label: "Highest Amount" },
  { value: "totalAmount-asc", label: "Lowest Amount" },
  { value: "status-asc", label: "Status" },
];

export default function VendorOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    OrderStatus | "All Status"
  >("All Status");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "active">(
    "all"
  );
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    loadOrders();
    loadStats();
  }, [currentPage, selectedStatus, sortBy]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const [sortField, sortOrder] = sortBy.split("-");
      const filters: OrderFilters = {
        status: selectedStatus,
        page: currentPage,
        limit: 20,
        sortBy: sortField,
        sortOrder: sortOrder as "asc" | "desc",
      };

      const response = await orderApi.getSellerOrders(filters);

      if (response.success && response.orders) {
        setOrders(response.orders);
        setTotalPages(response.pagination.totalPages);
        setTotalOrdersCount(response.pagination.totalOrders);
      } else {
        setOrders([]);
        toast.error("Failed to load orders");
      }
    } catch (error: any) {
      console.error("Failed to load orders:", error);
      setOrders([]);
      toast.error(error.response?.data?.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await orderApi.getSellerStats("month");

      if (response.success && response.stats) {
        setStats({
          totalOrders: response.stats.totalOrders || 0,
          pendingOrders: response.stats.pendingOrders || 0,
          activeOrders: response.stats.activeOrders || 0,
          completedOrders: response.stats.completedOrders || 0,
          cancelledOrders: response.stats.cancelledOrders || 0,
          totalRevenue: response.stats.totalRevenue || 0,
          averageOrderValue: response.stats.averageOrderValue || 0,
        });
      } else {
        setStats({
          totalOrders: 0,
          pendingOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
        });
      }
    } catch (error: any) {
      console.error("Failed to load stats:", error);
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        activeOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      });
    }
  };

  const filteredAndSortedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) {
      return [];
    }

    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.products?.some((p: any) =>
          p.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesTab =
        selectedTab === "all" ||
        (selectedTab === "pending" && order.status === "pending") ||
        (selectedTab === "active" &&
          ["confirmed", "processing", "shipped"].includes(order.status));

      return matchesSearch && matchesTab;
    });
  }, [orders, searchTerm, selectedTab]);

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return {
          color:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-900/30",
          icon: Clock,
          label: "Pending",
        };
      case "confirmed":
        return {
          color:
            "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30",
          icon: CheckCircle,
          label: "Confirmed",
        };
      case "processing":
        return {
          color:
            "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30",
          icon: Activity,
          label: "Processing",
        };
      case "shipped":
        return {
          color:
            "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200/50 dark:border-green-900/30",
          icon: Truck,
          label: "Shipped",
        };
      case "delivered":
        return {
          color:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30",
          icon: CheckCircle,
          label: "Delivered",
        };
      case "cancelled":
        return {
          color:
            "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200/50 dark:border-red-900/30",
          icon: XCircle,
          label: "Cancelled",
        };
      case "refunded":
        return {
          color:
            "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200/50 dark:border-orange-900/30",
          icon: DollarSign,
          label: "Refunded",
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 border-gray-200/50 dark:border-gray-700/50",
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
    return `${address.addressLine1 || ""}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
  };

  const handleUpdateStatus = (order: Order) => {
    setUpdatingOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingId || "");
    setStatusNote("");
    setIsUpdateStatusOpen(true);
  };

  const saveStatusUpdate = async () => {
    if (!updatingOrder) return;

    try {
      const updateData: any = {
        status: newStatus,
        notes: statusNote,
      };

      if (trackingNumber) {
        updateData.trackingId = trackingNumber;
      }

      await orderApi.updateOrderStatus(
        updatingOrder.id || updatingOrder._id!,
        updateData
      );

      setIsUpdateStatusOpen(false);
      setUpdatingOrder(null);
      toast.success(
        `Order ${updatingOrder.orderNumber} status updated to ${newStatus}`
      );

      loadOrders();
      loadStats();
    } catch (error: any) {
      console.error("Failed to update order status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update order status"
      );
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getOrderProgress = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return 10;
      case "confirmed":
        return 30;
      case "processing":
        return 50;
      case "shipped":
        return 75;
      case "delivered":
        return 100;
      case "cancelled":
      case "refunded":
        return 0;
      default:
        return 0;
    }
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedOrder === (order.id || order._id);
    const progress = getOrderProgress(order.status);
    const orderId = order._id?.toString() || order.id?.toString() || "";

    return (
      <Card className="group border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden hover:scale-[1.01]">
        <CardContent className="p-6">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full ${statusConfig.color.split(" ")[0].replace("100", "100/80").replace("950/30", "950/30")} flex items-center justify-center shadow-md`}
              >
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {order.orderNumber || order.id || order._id}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <Badge
              className={`${statusConfig.color} flex items-center gap-1.5 border shadow-sm backdrop-blur-sm`}
              variant="outline"
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Customer Info */}
          <div className="flex items-center justify-between mb-4 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100 block">
                  {order.customerName}
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {order.customerEmail || "Customer"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${order.totalAmount?.toFixed(2) || "0.00"}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {order.products?.length || 0} item
                {order.products?.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {order.status !== "cancelled" && order.status !== "refunded" && (
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
          )}

          {/* Order Details - Expanded */}
          {isExpanded && (
            <div className="space-y-4 mb-4 border-t border-gray-200/50 dark:border-gray-700/50 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Products */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products
                </h4>
                {order.products && order.products.length > 0 ? (
                  order.products.map((item: any, index: number) => {
                    const productImage =
                      item.productSnapshot?.images?.[0]?.url ||
                      item.productSnapshot?.images?.[0]?.cloudinaryUrl ||
                      item.image ||
                      null;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          {productImage ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200/80 dark:bg-gray-700/60 backdrop-blur-sm shadow-md">
                              <img
                                src={productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                              <Package className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100 block">
                              {item.productName}
                            </span>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Qty: {item.quantity} @ $
                              {item.price?.toFixed(2) || "0.00"}
                            </p>
                            {item.sku && (
                              <p className="text-xs text-gray-500">
                                SKU: {item.sku}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          $
                          {item.subtotal?.toFixed(2) ||
                            (item.quantity * (item.price || 0)).toFixed(2)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No products in this order
                  </p>
                )}
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <div className="p-3 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatAddress(order.shippingAddress)}
                    </p>
                  </div>
                </div>
              )}

              {/* Tracking Info */}
              {order.trackingId && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Tracking Information
                  </h4>
                  <div className="p-3 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                      {order.trackingId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <Button
              onClick={() => toggleOrderExpansion(orderId)}
              variant="outline"
              className="hidden lg:flex items-center gap-2"
            >
              {isExpanded ? "Show Less" : "View Details"}
              <ChevronRight
                className={`h-4 w-4 ml-1 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
              />
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (orderId) {
                    window.open(`/vendor/orders/${orderId}`, "_blank");
                  } else {
                    toast.error("Invalid order ID");
                  }
                }}
                variant="outline"
                className="hidden lg:flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Order
              </Button>

              {order.status !== "delivered" &&
                order.status !== "cancelled" &&
                order.status !== "refunded" && (
                  <button
                    onClick={() => {
                      if (orderId) {
                        window.open(`/vendor/orders/${orderId}/edit`, "_blank");
                      } else {
                        toast.error("Invalid order ID");
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    Edit Order
                  </button>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                Order Management
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Manage customer orders and track fulfillment
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  loadOrders();
                  loadStats();
                }}
                variant="outline"
                className="hidden lg:flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors cursor-pointer shadow-lg hover:shadow-xl">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className={`transform transition-all duration-700 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "Total Orders",
                value: stats?.totalOrders || 0,
                subtitle: "All time",
                icon: Package,
                iconColor: "text-blue-600",
                iconBg: "bg-blue-100 dark:bg-blue-900/30",
              },
              {
                title: "Pending",
                value: stats?.pendingOrders || 0,
                subtitle: "Need attention",
                icon: Clock,
                iconColor: "text-yellow-600",
                iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
              },
              {
                title: "Active",
                value: stats?.activeOrders || 0,
                subtitle: "In progress",
                icon: Truck,
                iconColor: "text-green-600",
                iconBg: "bg-green-100 dark:bg-green-900/30",
              },
              {
                title: "Completed",
                value: stats?.completedOrders || 0,
                subtitle: "Delivered",
                icon: CheckCircle,
                iconColor: "text-emerald-600",
                iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
              },
              {
                title: "Revenue",
                value: `$${(stats?.totalRevenue || 0).toFixed(0)}`,
                subtitle: "Total earnings",
                icon: DollarSign,
                iconColor: "text-purple-600",
                iconBg: "bg-purple-100 dark:bg-purple-900/30",
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:scale-[1.02]"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`h-10 w-10 rounded-full ${stat.iconBg} flex items-center justify-center shadow-md`}
                    >
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
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

        {/* Filters Card */}
        <div
          className={`transform transition-all duration-700 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Filter className="h-4 w-4 text-purple-600" />
                </div>
                Filters & Search
              </CardTitle>
              <CardDescription>
                Filter and search through your orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 p-1 bg-gray-100/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 w-fit">
                {[
                  { key: "all", label: "All Orders", count: null },
                  {
                    key: "pending",
                    label: "Pending",
                    count: stats?.pendingOrders || 0,
                    icon: Clock,
                  },
                  {
                    key: "active",
                    label: "Active",
                    count: stats?.activeOrders || 0,
                    icon: Truck,
                  },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedTab(tab.key as any)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                        selectedTab === tab.key
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {TabIcon && (
                        <TabIcon className="h-4 w-4 inline-block mr-1.5" />
                      )}
                      {tab.label}
                      {tab.count !== null && (
                        <span className="ml-1.5 text-xs">({tab.count})</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Input field - border color matches add-product */}
                <div className="relative w-full">
                  {/* Center the search icon */}
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search orders, customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-12 w-full min-w-[240px] bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
                  />
                </div>

                {/* Status dropdown - border color matches add-product */}
                <div className="w-full">
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) =>
                      setSelectedStatus(value as OrderStatus | "All Status")
                    }
                  >
                    <SelectTrigger className="h-12 w-full min-w-[240px] bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[240px]">
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort dropdown - border color matches add-product */}
                <div className="w-full">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12 w-full min-w-[240px] bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[240px]">
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results and Active Filters */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredAndSortedOrders.length} of {totalOrdersCount} orders
                </p>

                <div className="flex gap-2">
                  {searchTerm && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-white/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50"
                    >
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
                    <Badge
                      variant="outline"
                      className="text-xs bg-white/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50"
                    >
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
          className={`transform transition-all duration-700 delay-400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          {filteredAndSortedOrders.length > 0 ? (
            <div className="space-y-6">
              {filteredAndSortedOrders.map((order) => (
                <OrderCard key={order.id || order._id} order={order} />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm"
                          }
                        >
                          {page}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && <span className="px-2">...</span>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center py-16 border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden">
              <CardContent>
                <div className="h-20 w-20 mx-auto mb-6 bg-gray-100/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {totalOrdersCount === 0 ? "No Orders Yet" : "No Orders Found"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {totalOrdersCount === 0
                    ? "When customers place orders, they will appear here."
                    : "Try adjusting your search terms or filters."}
                </p>
                {totalOrdersCount === 0 ? (
                  <button
                    onClick={() => window.open("/vendor/my-products", "_self")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    <Package className="h-4 w-4" />
                    Manage Products
                  </button>
                ) : (
                  <div className="flex justify-center">
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedStatus("All Status");
                        setSelectedTab("all");
                      }}
                      variant="outline"
                      className="inline-flex items-center gap-2"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Update Status Dialog */}
        <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
          <DialogContent className="max-w-md bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                Update Order Status
              </DialogTitle>
              <DialogDescription>
                Update the status of order{" "}
                {updatingOrder?.orderNumber || updatingOrder?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">New Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as OrderStatus)}
                >
                  <SelectTrigger className="mt-1 h-12 w-full min-w-[240px] bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
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
                    className="mt-1 h-12 w-full min-w-[240px] bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
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
                  className="mt-1 w-full min-w-[240px] bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
                />
              </div>

              {updatingOrder && (
                <div className="bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl space-y-2 border border-gray-200/50 dark:border-gray-700/50">
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
                      ${updatingOrder.totalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Current Status:
                    </span>
                    <Badge
                      className={`${getStatusConfig(updatingOrder.status).color} text-xs border`}
                      variant="outline"
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
                className="bg-white/50 dark:bg-gray-900/50"
              >
                Cancel
              </Button>
              <Button
                onClick={saveStatusUpdate}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
