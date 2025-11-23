/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  MagnifyingGlassIcon,
  CubeIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  MapPinIcon,
  UserIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  HomeIcon,
  ChartBarIcon,
  ArrowPathIcon as LoaderIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { Order, OrderStatus } from "@/types";
import { toast } from "sonner";
import { orderApi, OrderFilters } from "@/lib/api/vendor.order.api";
import { colors, badgeColors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { usePageTitle } from "@/hooks/use-page-title";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  usePageTitle("Orders");
  const { user } = useAuth();
  const router = useRouter();
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
        limit: 10,
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
          color: `${badgeColors.yellow.bg} ${badgeColors.yellow.border} ${badgeColors.yellow.text} border backdrop-blur-sm rounded-none`,
          icon: ClockIcon,
          label: "Pending",
        };
      case "confirmed":
        return {
          color: `${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} border backdrop-blur-sm rounded-none`,
          icon: CheckCircleIcon,
          label: "Confirmed",
        };
      case "processing":
        return {
          color: `${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} border backdrop-blur-sm rounded-none`,
          icon: ChartBarIcon,
          label: "Processing",
        };
      case "shipped":
        return {
          color: `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} border backdrop-blur-sm rounded-none`,
          icon: TruckIcon,
          label: "Shipped",
        };
      case "delivered":
        return {
          color: `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} border backdrop-blur-sm rounded-none`,
          icon: CheckCircleIcon,
          label: "Delivered",
        };
      case "cancelled":
        return {
          color: `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} border backdrop-blur-sm rounded-none`,
          icon: XCircleIcon,
          label: "Cancelled",
        };
      case "refunded":
        return {
          color: `${badgeColors.amber.bg} ${badgeColors.amber.border} ${badgeColors.amber.text} border backdrop-blur-sm rounded-none`,
          icon: CurrencyDollarIcon,
          label: "Refunded",
        };
      default:
        return {
          color: `${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} border backdrop-blur-sm rounded-none`,
          icon: CubeIcon,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "CVT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyAbbreviated = (amount: number) => {
    if (amount >= 1e9) {
      return `CVT ${(amount / 1e9).toFixed(2)} B`;
    } else if (amount >= 1e6) {
      return `CVT ${(amount / 1e6).toFixed(2)} M`;
    } else {
      return formatCurrency(amount);
    }
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedOrder === (order.id || order._id);
    const progress = getOrderProgress(order.status);
    const orderId = order._id?.toString() || order.id?.toString() || "";

    return (
      <Card className="group bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden rounded-none !shadow-none transition-colors duration-200">
        <CardContent className="">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 flex items-center justify-center`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {order.orderNumber || order.id || order._id}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <ClockIcon className="h-3 w-3" />
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <Badge
              className={`${statusConfig.color} flex items-center gap-1.5 border backdrop-blur-sm rounded-none`}
              variant="outline"
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Customer Info */}
          <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 backdrop-blur-sm ${colors.borders.primary} rounded-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <span className="text-sm font-medium ${colors.texts.secondary} block">
                  {order.customerName}
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {order.customerEmail || "Customer"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                CVT {order.totalAmount?.toFixed(2) || "0.00"}
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
              <Progress value={progress} className="h-2 rounded-none" />
            </div>
          )}

          {/* Order Details - Expanded */}
          {isExpanded && (
            <div className="space-y-4 mb-4 ${colors.borders.primary} pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Products */}
              <div className="space-y-3">
                <h4 className="font-medium ${colors.texts.secondary} flex items-center gap-2">
                  <CubeIcon className="h-4 w-4" />
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
                        className="flex items-center justify-between p-3 bg-gray-100 backdrop-blur-sm ${colors.borders.primary} transition-shadow rounded-none"
                      >
                        <div className="flex items-center gap-3">
                          {productImage ? (
                            <div className="w-12 h-16 bg-gray-200/80 dark:bg-gray-700/60 backdrop-blur-sm">
                              <img
                                src={productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-16 flex items-center justify-center">
                              <CubeIcon className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium ${colors.texts.secondary} block">
                              {item.productName}
                            </span>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Qty: {item.quantity} @ CVT
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
                          CVT
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
                  <h4 className="font-medium ${colors.texts.secondary} flex items-center gap-2">
                    <HomeIcon className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <div className="p-3 bg-gray-100 backdrop-blur-sm ${colors.borders.primary} rounded-none">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatAddress(order.shippingAddress)}
                    </p>
                  </div>
                </div>
              )}

              {/* Tracking Info */}
              {order.trackingId && (
                <div className="space-y-2">
                  <h4 className="font-medium ${colors.texts.secondary} flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    Tracking Information
                  </h4>
                  <div className="p-3 bg-gray-100 backdrop-blur-sm ${colors.borders.primary} rounded-none">
                    <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                      {order.trackingId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 ${colors.borders.primary}">
            <Button
              onClick={() => toggleOrderExpansion(orderId)}
              variant="outline"
              className="hidden lg:flex items-center gap-2 h-9 rounded-none hover:border-black cursor-pointer"
            >
              {isExpanded ? "Show Less" : "View Details"}
              <ChevronRightIcon
                className={`h-4 w-4 ml-1 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
              />
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (orderId) {
                    router.push(`/vendor/orders/${orderId}`);
                  } else {
                    toast.error("Invalid order ID");
                  }
                }}
                variant="outline"
                className="hidden lg:flex items-center gap-2 h-9 rounded-none hover:border-black cursor-pointer"
              >
                <EyeIcon className="h-4 w-4" />
                View Order
              </Button>

              {order.status !== "delivered" &&
                order.status !== "cancelled" &&
                order.status !== "refunded" && (
                  <Button
                    onClick={() => {
                      if (orderId) {
                        router.push(`/vendor/orders/${orderId}/edit`);
                      } else {
                        toast.error("Invalid order ID");
                      }
                    }}
                    variant="default"
                    className="flex items-center gap-2 h-9 rounded-none hover:border-black cursor-pointer"
                  >
                    Edit Order
                  </Button>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.backgrounds.secondary}`}>
      <div className="relative z-10 p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendor">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Orders</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                Order Management
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Manage customer orders and track fulfillment
              </p>
              <div className={`flex items-center gap-3 mt-2`}>
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  <ShoppingBagIcon
                    className={`h-3 w-3 mr-1 ${badgeColors.green.icon}`}
                  />
                  Order Management
                </Badge>
                <Badge
                  className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} flex items-center gap-1 text-xs rounded-none`}
                >
                  <ShieldCheckIcon
                    className={`h-3 w-3 ${badgeColors.cyan.icon}`}
                  />
                  Blockchain Verified
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className={`flex items-center gap-2 ${colors.buttons.primary} cursor-pointer rounded-none transition-all`}
              >
                <ArrowDownTrayIcon
                  className={`h-4 w-4 text-white dark:text-gray-900`}
                />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "Total Orders",
                value: stats?.totalOrders || 0,
                subtitle: "All time",
                icon: CubeIcon,
              },
              {
                title: "Pending",
                value: stats?.pendingOrders || 0,
                subtitle: "Need attention",
                icon: ClockIcon,
              },
              {
                title: "Active",
                value: stats?.activeOrders || 0,
                subtitle: "In progress",
                icon: TruckIcon,
              },
              {
                title: "Completed",
                value: stats?.completedOrders || 0,
                subtitle: "Delivered",
                icon: CheckCircleIcon,
              },
              {
                title: "Revenue",
                value: formatCurrencyAbbreviated(stats?.totalRevenue || 0),
                subtitle: "Total earnings",
                icon: CurrencyDollarIcon,
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02]`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle
                      className={`text-xs font-medium ${colors.texts.secondary}`}
                    >
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${colors.icons.primary}`} />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-lg font-bold ${colors.texts.primary} mb-1`}
                    >
                      {stat.value}
                    </div>
                    <p className={`text-xs ${colors.texts.secondary}`}>
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
          className={`transform transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card
            className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <FunnelIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                Filters & Search
              </CardTitle>
              <CardDescription className={`text-xs ${colors.texts.secondary}`}>
                Filter and search through your orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Bar - Full Width */}
              <div className="relative w-full">
                <MagnifyingGlassIcon
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                />
                <Input
                  placeholder="Search orders, customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${colors.inputs.base} pl-9 h-9 w-full ${colors.inputs.focus} transition-colors duration-200`}
                />
              </div>

              {/* Dropdowns - Second Line */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  value={selectedStatus}
                  onValueChange={(value) =>
                    setSelectedStatus(value as OrderStatus | "All Status")
                  }
                >
                  <SelectTrigger
                    className={`text-sm h-9 w-full ${colors.inputs.base} cursor-pointer ${colors.inputs.focus} transition-colors duration-200`}
                  >
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {statusOptions.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="text-sm h-9"
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger
                    className={`text-sm h-9 w-full ${colors.inputs.base} cursor-pointer ${colors.inputs.focus} transition-colors duration-200`}
                  >
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {sortOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-sm h-9"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 items-center mt-2">
                {searchTerm && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${colors.backgrounds.primary} ${colors.borders.primary} ${colors.texts.secondary} rounded-none`}
                  >
                    &quot;{searchTerm}&quot;
                    <button
                      onClick={() => setSearchTerm("")}
                      className={`ml-1 ${colors.texts.secondary} hover:${colors.texts.primary} cursor-pointer`}
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedStatus !== "All Status" && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${colors.backgrounds.primary} ${colors.borders.primary} ${colors.texts.secondary} rounded-none`}
                  >
                    {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus("All Status")}
                      className={`ml-1 ${colors.texts.secondary} hover:${colors.texts.primary} cursor-pointer`}
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <span
                  className={`text-xs ${colors.texts.secondary} ml-2 whitespace-nowrap`}
                >
                  {filteredAndSortedOrders.length} of {totalOrdersCount} orders
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Moved below filters */}
        <div
          className={`flex justify-center mt-6 transition-all duration-700 delay-350 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="w-full flex justify-center">
            <div
              className={`flex w-full max-w-2xl ${colors.borders.primary} ${colors.backgrounds.tertiary} p-0.5 rounded-none mx-auto`}
            >
              {[
                {
                  key: "all",
                  label: "All Orders",
                  count: null,
                  icon: CubeIcon,
                },
                {
                  key: "pending",
                  label: "Pending",
                  count: stats?.pendingOrders || 0,
                  icon: ClockIcon,
                },
                {
                  key: "active",
                  label: "Active",
                  count: stats?.activeOrders || 0,
                  icon: TruckIcon,
                },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key as any)}
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                    ${
                      selectedTab === tab.key
                        ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                        : `${colors.texts.secondary} hover:${colors.texts.primary}`
                    } flex items-center gap-2 justify-center`}
                  >
                    <TabIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {filteredAndSortedOrders.length > 0 ? (
            <div className="space-y-6">
              {filteredAndSortedOrders.map((order) => (
                <OrderCard key={order.id || order._id} order={order} />
              ))}

              {/* Pagination */}
              {totalOrdersCount > 10 && (
                <Pagination className="mt-8 rounded-none">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    {totalPages > 5 && <PaginationEllipsis />}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <CubeIcon
                className={`h-16 w-16 mx-auto ${colors.icons.muted} mb-4`}
              />
              <h3
                className={`text-lg font-medium ${colors.texts.primary} mb-2`}
              >
                {totalOrdersCount === 0 ? "No Orders Yet" : "No Orders Found"}
              </h3>
              <p className={`text-sm ${colors.texts.secondary}`}>
                {totalOrdersCount === 0
                  ? "When customers place orders, they will appear here."
                  : "Try adjusting your search terms or filters."}
              </p>
            </div>
          )}
        </div>

        {/* Update Status Dialog */}
        <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
          <DialogContent
            className={`${colors.backgrounds.modal} rounded-none max-w-md`}
          >
            <DialogHeader>
              <DialogTitle className={`${colors.texts.primary}`}>
                Update Order Status
              </DialogTitle>
              <DialogDescription className={`${colors.texts.secondary}`}>
                Update the status of order{" "}
                {updatingOrder?.orderNumber || updatingOrder?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className={`${colors.texts.primary}`}>New Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as OrderStatus)}
                >
                  <SelectTrigger
                    className={`mt-1 h-9 w-full min-w-[240px} ${colors.inputs.base} cursor-pointer ${colors.inputs.focus} transition-colors duration-200`}
                  >
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
                  <Label className={`${colors.texts.primary}`}>
                    Tracking Number
                  </Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className={`mt-1 h-9 w-full min-w-[240px} ${colors.inputs.base} ${colors.inputs.focus} transition-colors duration-200`}
                  />
                </div>
              )}

              <div>
                <Label className={`${colors.texts.primary}`}>
                  Status Note (Optional)
                </Label>
                <Textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Add a note about this status update..."
                  rows={3}
                  className={`mt-1 w-full min-w-[240px} ${colors.inputs.base} ${colors.inputs.focus} transition-colors duration-200`}
                />
              </div>

              {updatingOrder && (
                <div
                  className={`p-4 ${colors.backgrounds.accent} rounded-none`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${colors.texts.secondary}`}>
                      Customer:
                    </span>
                    <span className={`font-medium ${colors.texts.primary}`}>
                      {updatingOrder.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${colors.texts.secondary}`}>
                      Order Total:
                    </span>
                    <span className={`font-medium ${colors.texts.primary}`}>
                      CVT {updatingOrder.totalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${colors.texts.secondary}`}>
                      Current Status:
                    </span>
                    <Badge
                      className={`text-xs rounded-none px-2 py-0.5 ${getStatusConfig(updatingOrder.status).color}`}
                      variant="secondary"
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
                className={`${colors.buttons.outline} rounded-none`}
              >
                Cancel
              </Button>
              <Button
                onClick={saveStatusUpdate}
                className={`${colors.buttons.primary} rounded-none`}
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
