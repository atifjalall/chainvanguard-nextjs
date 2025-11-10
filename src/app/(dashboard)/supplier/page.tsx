/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  CubeIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TagIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ShoppingCartIcon,
  BoltIcon,
  StarIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import SupplierDashboardSkeleton from "@/components/skeletons/supplierDashboardSkeleton";
import { badgeColors, colors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface DashboardMetrics {
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
}

interface RecentActivity {
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

interface TopVendor {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  status: "active" | "pending" | "inactive";
  joinedDate: string;
  location: {
    city: string;
    country: string;
  };
  rating?: number;
  lastOrderDate?: string;
}

interface TopProduct {
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

// Mock data
const mockRecentActivity: RecentActivity[] = [
  {
    id: "act-001",
    type: "order_received",
    title: "New Order Received",
    description: "TechVendor Pro ordered 50x Industrial Steel Rods",
    timestamp: "2025-08-16T14:30:00Z",
    status: "success",
    amount: 12500,
    customer: "TechVendor Pro",
  },
  {
    id: "act-002",
    type: "vendor_added",
    title: "New Vendor Partnership",
    description: "Fashion Hub joined as vendor partner",
    timestamp: "2025-08-16T10:15:00Z",
    status: "info",
    customer: "Fashion Hub",
  },
  {
    id: "act-003",
    type: "stock_low",
    title: "Low Stock Alert",
    description: "Electronic Circuit Boards running low (15 units remaining)",
    timestamp: "2025-08-16T09:45:00Z",
    status: "warning",
  },
  {
    id: "act-004",
    type: "transaction_completed",
    title: "Transaction Completed",
    description: "Payment received from Manufacturing Corp",
    timestamp: "2025-08-15T16:20:00Z",
    status: "success",
    amount: 8750,
    customer: "Manufacturing Corp",
  },
  {
    id: "act-005",
    type: "product_added",
    title: "New Product Added",
    description: "Added Precision Machine Parts to supply catalog",
    timestamp: "2025-08-15T13:10:00Z",
    status: "info",
  },
];

const mockTopVendors: TopVendor[] = [
  {
    id: "vend-001",
    name: "TechVendor Pro",
    email: "contact@techvendor.com",
    totalOrders: 85,
    totalSpent: 125000,
    averageOrderValue: 1470.59,
    status: "active",
    joinedDate: "2024-11-15T00:00:00Z",
    location: { city: "San Francisco", country: "USA" },
    rating: 4.8,
    lastOrderDate: "2025-08-16T14:30:00Z",
  },
  {
    id: "vend-002",
    name: "Fashion Hub",
    email: "orders@fashionhub.com",
    totalOrders: 62,
    totalSpent: 98000,
    averageOrderValue: 1580.65,
    status: "active",
    joinedDate: "2025-01-22T00:00:00Z",
    location: { city: "New York", country: "USA" },
    rating: 4.6,
    lastOrderDate: "2025-08-15T11:20:00Z",
  },
  {
    id: "vend-003",
    name: "Industrial Solutions",
    email: "procurement@industrialsol.com",
    totalOrders: 54,
    totalSpent: 87000,
    averageOrderValue: 1611.11,
    status: "active",
    joinedDate: "2024-09-08T00:00:00Z",
    location: { city: "Chicago", country: "USA" },
    rating: 4.9,
    lastOrderDate: "2025-08-14T16:45:00Z",
  },
  {
    id: "vend-004",
    name: "Manufacturing Corp",
    email: "supply@mfgcorp.com",
    totalOrders: 48,
    totalSpent: 79000,
    averageOrderValue: 1645.83,
    status: "pending",
    joinedDate: "2025-02-10T00:00:00Z",
    location: { city: "Detroit", country: "USA" },
    rating: 4.4,
    lastOrderDate: "2025-08-13T09:30:00Z",
  },
];

const mockTopProducts: TopProduct[] = [
  {
    id: "prod-001",
    name: "Industrial Steel Rods",
    category: "Raw Materials",
    totalSold: 2250,
    revenue: 89500,
    currentStock: 500,
    status: "active",
    lastSold: "2025-08-16T14:30:00Z",
    averageRating: 4.7,
  },
  {
    id: "prod-002",
    name: "Electronic Circuit Boards",
    category: "Electronics Components",
    totalSold: 795,
    revenue: 71500,
    currentStock: 15,
    status: "low_stock",
    lastSold: "2025-08-15T10:15:00Z",
    averageRating: 4.9,
  },
  {
    id: "prod-003",
    name: "Organic Cotton Fabric",
    category: "Textiles & Fabrics",
    totalSold: 4960,
    revenue: 62000,
    currentStock: 2000,
    status: "active",
    lastSold: "2025-08-14T16:20:00Z",
    averageRating: 4.5,
  },
  {
    id: "prod-004",
    name: "Precision Machine Parts",
    category: "Machinery & Equipment",
    totalSold: 285,
    revenue: 53800,
    currentStock: 0,
    status: "out_of_stock",
    lastSold: "2025-08-12T12:45:00Z",
    averageRating: 4.8,
  },
];

// Custom Rs Icon component
const RsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="h-5 w-5"
  >
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fontSize="8"
      fontWeight="600"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.2"
      fontFamily="Arial, sans-serif"
    >
      Rs
    </text>
    <path
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

export default function SupplierDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] =
    useState<RecentActivity[]>(mockRecentActivity);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Load inventory
      const savedInventory = localStorage.getItem(
        `supplier_${user?.id}_products`
      );
      const inventoryData = savedInventory ? JSON.parse(savedInventory) : [];
      setInventory(inventoryData);

      // Load vendors
      const savedVendors = localStorage.getItem(`supplier_${user?.id}_vendors`);
      const vendorsData = savedVendors ? JSON.parse(savedVendors) : [];

      // Load transactions
      const savedTransactions = localStorage.getItem(
        `supplier_${user?.id}_transactions`
      );
      const transactionsData = savedTransactions
        ? JSON.parse(savedTransactions)
        : [];

      setVendors(vendorsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate comprehensive metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const totalInventory = inventory.length;
    const activeInventory = inventory.filter(
      (i) => i.status === "active"
    ).length;
    const lowStockInventory = inventory.filter(
      (i) => i.quantity < (i.minimumOrderQuantity || 10) * 2
    ).length;
    const outOfStockInventory = inventory.filter(
      (i) => i.quantity === 0
    ).length;
    const totalInventoryValue = inventory.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    const totalVendors = vendors.length;
    const pendingVendors = vendors.filter((v) => v.status === "pending").length;

    const totalTransactions = transactions.length;
    const completedTransactions = transactions.filter(
      (t) => t.status === "completed"
    ).length;
    const totalRevenue = transactions
      .filter((t) => t.status === "completed" && t.type === "sale")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalOrders = transactions.filter((t) => t.type === "sale").length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalInventory,
      totalVendors,
      totalTransactions,
      totalRevenue,
      totalOrders,
      activeInventory,
      lowStockInventory,
      outOfStockInventory,
      pendingVendors,
      completedTransactions,
      totalInventoryValue,
      avgOrderValue,
    };
  }, [inventory, vendors, transactions]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order_received":
        return ShoppingCartIcon;
      case "vendor_added":
        return UsersIcon;
      case "stock_low":
        return ExclamationTriangleIcon;
      case "product_added":
        return CubeIcon;
      case "transaction_completed":
        return CheckCircleIcon;
      default:
        return BoltIcon;
    }
  };

  const getActivityColor = (status?: string) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-orange-600 dark:text-orange-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      case "danger":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          color:
            "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
          icon: CheckCircleIcon,
          label: "Active",
        };
      case "pending":
        return {
          color:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
          icon: ClockIcon,
          label: "Pending",
        };
      case "inactive":
        return {
          color:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: XCircleIcon,
          label: "Inactive",
        };
      case "low_stock":
        return {
          color:
            "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
          icon: ExclamationTriangleIcon,
          label: "Low Stock",
        };
      case "out_of_stock":
        return {
          color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
          icon: XCircleIcon,
          label: "Out of Stock",
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: ClockIcon,
          label: "Unknown",
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
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

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (isLoading) {
    return <SupplierDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                Supplier Dashboard
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Manage your inventory, vendors, and supply operations
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  {metrics.totalInventory} Inventory Items
                </Badge>
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  {metrics.totalVendors} Vendors
                </Badge>
                <Badge
                  className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} flex items-center gap-1 text-xs rounded-none`}
                >
                  <ShieldCheckIcon
                    className={`h-3 w-3 ${badgeColors.blue.icon}`}
                  />
                  Blockchain Secured
                </Badge>
              </div>
            </div>
            <button
              onClick={() => router.push("/supplier/add-inventory")}
              className={`flex items-center gap-2 px-4 py-2 ${colors.buttons.primary} font-medium transition-colors cursor-pointer rounded-none`}
            >
              <PlusIcon className="h-4 w-4" />
              Add Inventory
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {[
              {
                title: "Total Revenue",
                value: formatCurrency(metrics.totalRevenue || 389000),
                subtitle: "+12.5% vs last month",
                icon: RsIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
              {
                title: "Active Vendors",
                value: metrics.totalVendors,
                subtitle: `${metrics.pendingVendors} pending`,
                icon: UsersIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
              {
                title: "Total Inventory",
                value: metrics.totalInventory,
                subtitle: `${metrics.activeInventory} active`,
                icon: BuildingStorefrontIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
              {
                title: "Inventory Value",
                value: formatCurrency(metrics.totalInventoryValue || 137000),
                subtitle: "Current stock value",
                icon: CubeIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
              {
                title: "Low Stock Items",
                value: metrics.lowStockInventory,
                subtitle: "Need reordering",
                icon: ExclamationTriangleIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
              {
                title: "Avg Order Value",
                value: formatCurrency(metrics.avgOrderValue || 1547),
                subtitle: "+3.8% vs last month",
                icon: TagIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              const isPercentage = stat.subtitle.includes("%");
              const [percentagePart, restPart] = isPercentage
                ? stat.subtitle.split(" vs ")
                : [stat.subtitle, ""];
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
                    <div
                      className={`h-10 w-10 flex items-center justify-center rounded-none`}
                    >
                      <Icon className={`h-5 w-5 ${colors.icons.primary}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-lg font-bold ${colors.texts.primary} mb-1`}
                    >
                      {stat.value}
                    </div>
                    <p className="text-xs">
                      {isPercentage ? (
                        <>
                          <span className={colors.texts.success}>
                            {percentagePart}
                          </span>
                          <span className={colors.texts.secondary}>
                            {" "}
                            vs {restPart}
                          </span>
                        </>
                      ) : (
                        <span className={colors.texts.secondary}>
                          {stat.subtitle}
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card
              className={`${colors.cards.base} xl:col-span-2 transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                >
                  <ClockIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                  Recent Activity
                </CardTitle>
                <CardDescription
                  className={`text-xs ${colors.texts.secondary}`}
                >
                  Latest updates from your supply chain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.slice(0, 6).map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div
                        key={activity.id}
                        className={`flex items-center gap-4 p-4 ${colors.backgrounds.tertiary} rounded-none ${colors.backgrounds.hover} transition-all cursor-pointer ${colors.borders.primary} hover:shadow-none`}
                        style={{ minHeight: "90px", alignItems: "center" }}
                      >
                        <div
                          className={`h-10 w-10 flex items-center justify-center rounded-none`}
                        >
                          <Icon className={`h-5 w-5 ${colors.icons.primary}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p
                              className={`font-semibold ${colors.texts.primary}`}
                            >
                              {activity.title}
                            </p>
                            <div className="flex items-center gap-2">
                              {activity.amount && (
                                <Badge
                                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                                >
                                  {formatCurrency(activity.amount)}
                                </Badge>
                              )}
                              <span className={`text-xs ${colors.texts.muted}`}>
                                {getTimeAgo(activity.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p
                            className={`text-xs ${colors.texts.secondary} mt-1`}
                          >
                            {activity.description}
                          </p>
                          {activity.customer && (
                            <p className={`text-xs ${colors.texts.muted} mt-1`}>
                              Customer: {activity.customer}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/supplier/transactions")}
                    className={`${colors.texts.primary} hover:${colors.backgrounds.hover} rounded-none border-0`}
                    style={{ borderRadius: 0 }}
                  >
                    View All Transactions
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                >
                  <ChartBarIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Revenue Goal
                    </span>
                    <span className={`text-xs ${colors.texts.secondary}`}>
                      {formatCurrency(389000)} / {formatCurrency(500000)}
                    </span>
                  </div>
                  <Progress value={78} className="h-2 rounded-none" />
                  <p className={`text-xs ${colors.texts.muted} mt-1`}>
                    78% completed
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      Vendor Satisfaction
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      4.7/5
                    </span>
                  </div>
                  <Progress value={94} className="h-2 rounded-none" />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    94% satisfaction rate
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      Stock Turnover
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      6.2x
                    </span>
                  </div>
                  <Progress value={85} className="h-2 rounded-none" />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Above industry average
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section */}
        <div
          className={`transform transition-all duration-700 delay-600 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Vendors */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                >
                  <UserGroupIcon
                    className={`h-5 w-5 ${colors.icons.primary}`}
                  />
                  Top Vendors
                </CardTitle>
                <CardDescription
                  className={`text-xs ${colors.texts.secondary}`}
                >
                  Your highest performing vendor partners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTopVendors.map((vendor, index) => {
                    const statusConfig = getStatusConfig(vendor.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div
                        key={vendor.id}
                        className={`flex items-center gap-4 p-4 ${colors.backgrounds.tertiary} rounded-none ${colors.backgrounds.hover} transition-all cursor-pointer ${colors.borders.primary} hover:shadow-none`}
                      >
                        <div className="relative">
                          <Avatar
                            className={`h-12 w-12 ${colors.borders.primary} rounded-none ${colors.backgrounds.tertiary}`}
                          >
                            <AvatarImage src="" alt={vendor.name} />
                            <AvatarFallback
                              className={`${colors.texts.primary} font-bold rounded-none`}
                            >
                              {getInitials(vendor.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4
                              className={`font-semibold ${colors.texts.primary} text-sm`}
                            >
                              {vendor.name}
                            </h4>
                            <Badge
                              className={
                                vendor.status === "active"
                                  ? `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} flex items-center gap-1 text-xs rounded-none`
                                  : vendor.status === "pending"
                                    ? `${badgeColors.yellow.bg} ${badgeColors.yellow.border} ${badgeColors.yellow.text} flex items-center gap-1 text-xs rounded-none`
                                    : vendor.status === "inactive"
                                      ? `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} flex items-center gap-1 text-xs rounded-none`
                                      : "flex items-center gap-1 text-xs rounded-none"
                              }
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <p
                                className={`font-medium ${colors.texts.primary} text-xs`}
                              >
                                {formatCurrency(vendor.totalSpent)}
                              </p>
                              <p className={`${colors.texts.muted}`}>
                                Total Spent
                              </p>
                            </div>
                            <div>
                              <p
                                className={`font-medium ${colors.texts.primary} text-xs`}
                              >
                                {vendor.totalOrders}
                              </p>
                              <p className={`${colors.texts.muted}`}>Orders</p>
                            </div>
                            <div>
                              <p
                                className={`font-medium ${colors.texts.primary} text-xs`}
                              >
                                {vendor.rating}/5
                              </p>
                              <p className={`${colors.texts.muted}`}>Rating</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                >
                  <StarIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                  Top Products
                </CardTitle>
                <CardDescription
                  className={`text-xs ${colors.texts.secondary}`}
                >
                  Your best performing supply items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTopProducts.map((product) => {
                    const statusConfig = getStatusConfig(product.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center gap-4 p-4 ${colors.backgrounds.tertiary} rounded-none ${colors.backgrounds.hover} transition-all cursor-pointer ${colors.borders.primary} hover:shadow-none`}
                      >
                        <div
                          className={`h-12 w-12 ${colors.backgrounds.tertiary} flex items-center justify-center text-gray-900 dark:text-white font-bold rounded-none`}
                        >
                          {getInitials(product.name)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4
                              className={`font-semibold ${colors.texts.primary} text-sm`}
                            >
                              {product.name}
                            </h4>
                            <Badge
                              className={
                                product.status === "active"
                                  ? `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} flex items-center gap-1 text-xs rounded-none`
                                  : product.status === "low_stock"
                                    ? `${badgeColors.yellow.bg} ${badgeColors.yellow.border} ${badgeColors.yellow.text} flex items-center gap-1 text-xs rounded-none`
                                    : product.status === "out_of_stock"
                                      ? `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} flex items-center gap-1 text-xs rounded-none`
                                      : "flex items-center gap-1 text-xs rounded-none"
                              }
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <p
                                className={`font-medium ${colors.texts.primary} text-xs`}
                              >
                                {formatCurrency(product.revenue)}
                              </p>
                              <p className={`${colors.texts.muted}`}>Revenue</p>
                            </div>
                            <div>
                              <p
                                className={`font-medium ${colors.texts.primary} text-xs`}
                              >
                                {product.totalSold}
                              </p>
                              <p className={`${colors.texts.muted}`}>Sold</p>
                            </div>
                            <div>
                              <p
                                className={`font-medium ${colors.texts.primary} text-xs`}
                              >
                                {product.currentStock}
                              </p>
                              <p className={`${colors.texts.muted}`}>
                                In Stock
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className={`transform transition-all duration-700 delay-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card
            className={`${colors.cards.base} transition-all duration-300 mt-6 rounded-none !shadow-none hover:!shadow-none`}
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
              >
                <BoltIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                Quick Actions
              </CardTitle>
              <CardDescription className={`text-xs ${colors.texts.secondary}`}>
                Manage your supply chain efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <button
                  className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none !shadow-none hover:!shadow-none`}
                >
                  <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-none">
                    <PlusIcon className={`h-6 w-6 ${colors.texts.primary}`} />
                  </div>
                  <div className="text-center">
                    <p
                      className={`font-semibold ${colors.texts.primary} text-xs`}
                    >
                      Add Inventory
                    </p>
                    <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                      New supply item
                    </p>
                  </div>
                </button>
                <button
                  className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none !shadow-none hover:!shadow-none`}
                >
                  <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-none">
                    <UsersIcon className={`h-6 w-6 ${colors.texts.primary}`} />
                  </div>
                  <div className="text-center">
                    <p
                      className={`font-semibold ${colors.texts.primary} text-xs`}
                    >
                      Manage Vendors
                    </p>
                    <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                      Vendor partners
                    </p>
                  </div>
                </button>
                <button
                  className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none !shadow-none hover:!shadow-none`}
                >
                  <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-none">
                    <BuildingStorefrontIcon
                      className={`h-6 w-6 ${colors.texts.primary}`}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={`font-semibold ${colors.texts.primary} text-xs`}
                    >
                      Check Inventory
                    </p>
                    <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                      Stock overview
                    </p>
                  </div>
                </button>
                <button
                  className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none !shadow-none hover:!shadow-none`}
                >
                  <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-none">
                    <ChartBarIcon
                      className={`h-6 w-6 ${colors.texts.primary}`}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={`font-semibold ${colors.texts.primary} text-xs`}
                    >
                      View Analytics
                    </p>
                    <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                      Supply insights
                    </p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
