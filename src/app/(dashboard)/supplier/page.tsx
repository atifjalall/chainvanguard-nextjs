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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Building2,
  ArrowUpDown,
  Globe,
  Factory,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Warehouse,
  BarChart3,
  ArrowRight,
  ShoppingCart,
  TrendingDown,
  Zap,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Star,
  Award,
  Shield,
  Crown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Grid3X3,
  List,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Product } from "@/types";
import { toast } from "sonner";
import SupplierDashboardSkeleton from "@/components/skeletons/supplierDashboardSkeleton";

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
        return ShoppingCart;
      case "vendor_added":
        return Users;
      case "stock_low":
        return AlertTriangle;
      case "product_added":
        return Package;
      case "transaction_completed":
        return CheckCircle;
      default:
        return Activity;
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
          icon: CheckCircle,
          label: "Active",
        };
      case "pending":
        return {
          color:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
          icon: Clock,
          label: "Pending",
        };
      case "inactive":
        return {
          color:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: XCircle,
          label: "Inactive",
        };
      case "low_stock":
        return {
          color:
            "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
          icon: AlertTriangle,
          label: "Low Stock",
        };
      case "out_of_stock":
        return {
          color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
          icon: XCircle,
          label: "Out of Stock",
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
      currency: "USD",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Supplier Dashboard
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Manage your inventory, vendors, and supply operations
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-sm backdrop-blur-sm text-xs">
                  {metrics.totalInventory} Inventory Items
                </Badge>
                <Badge className="bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm backdrop-blur-sm text-xs">
                  {metrics.totalVendors} Vendors
                </Badge>
                <Badge
                  variant="outline"
                  className="border-blue-700 text-blue-700 bg-transparent dark:bg-blue-950 dark:text-blue-300 dark:border-blue-950 shadow-sm backdrop-blur-sm flex items-center gap-1 text-xs"
                >
                  <Shield className="h-3 w-3 mr-1 text-blue-500 dark:text-blue-300" />
                  Blockchain Secured
                </Badge>
              </div>
            </div>
            <button
              onClick={() => router.push("/supplier/add-inventory")}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors cursor-pointer shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
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
                icon: DollarSign,
                iconColor: "text-green-600",
                iconBg: "bg-green-100 dark:bg-green-900/30",
              },
              {
                title: "Active Vendors",
                value: metrics.totalVendors,
                subtitle: `${metrics.pendingVendors} pending`,
                icon: Users,
                iconColor: "text-blue-600",
                iconBg: "bg-blue-100 dark:bg-blue-900/30",
              },
              {
                title: "Total Inventory",
                value: metrics.totalInventory,
                subtitle: `${metrics.activeInventory} active`,
                icon: Warehouse,
                iconColor: "text-purple-600",
                iconBg: "bg-purple-100 dark:bg-purple-900/30",
              },
              {
                title: "Inventory Value",
                value: formatCurrency(metrics.totalInventoryValue || 137000),
                subtitle: "Current stock value",
                icon: Warehouse,
                iconColor: "text-orange-600",
                iconBg: "bg-orange-100 dark:bg-orange-900/30",
              },
              {
                title: "Low Stock Items",
                value: metrics.lowStockInventory,
                subtitle: "Need reordering",
                icon: AlertTriangle,
                iconColor: "text-amber-600",
                iconBg: "bg-amber-100 dark:bg-amber-900/30",
              },
              {
                title: "Avg Order Value",
                value: formatCurrency(metrics.avgOrderValue || 1547),
                subtitle: "+3.8% vs last month",
                icon: Target,
                iconColor: "text-yellow-600",
                iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="border border-white/20 dark:border-gray-700/30 shadow-md hover:shadow-lg transition-all duration-300 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:scale-[1.02]"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`h-10 w-10 rounded-full ${stat.iconBg} flex items-center justify-center shadow-md`}
                    >
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
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

        {/* Main Content */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl xl:col-span-2 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-xs">
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
                        className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all cursor-pointer border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md"
                        style={{
                          minHeight: "90px", // slightly reduced height
                          alignItems: "center", // vertical center
                        }}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            activity.status === "success"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : activity.status === "warning"
                                ? "bg-orange-100 dark:bg-orange-900/30"
                                : activity.status === "info"
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : "bg-gray-100 dark:bg-gray-800"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${getActivityColor(activity.status)}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {activity.title}
                            </p>
                            <div className="flex items-center gap-2">
                              {activity.amount && (
                                <Badge variant="outline" className="text-xs">
                                  {formatCurrency(activity.amount)}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {getTimeAgo(activity.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {activity.description}
                          </p>
                          {activity.customer && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
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
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    View All Transactions
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      Revenue Goal
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {formatCurrency(389000)} / {formatCurrency(500000)}
                    </span>
                  </div>
                  <Progress value={78} className="h-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
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
                  <Progress value={94} className="h-2" />
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
                  <Progress value={85} className="h-2" />
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
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Crown className="h-4 w-4 text-indigo-600" />
                  </div>
                  Top Vendors
                </CardTitle>
                <CardDescription className="text-xs">
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
                        className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all cursor-pointer border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md"
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-lg">
                            <AvatarImage src="" alt={vendor.name} />
                            <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 font-bold">
                              {getInitials(vendor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-1 -right-1">
                            {index === 0 && (
                              <div className="h-6 w-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <Crown className="h-3 w-3 text-yellow-600" />
                              </div>
                            )}
                            {index === 1 && (
                              <div className="h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <Award className="h-2 w-2 text-gray-600" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                              {vendor.name}
                            </h4>
                            <Badge
                              className={`${statusConfig.color} flex items-center gap-1 text-xs`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                {formatCurrency(vendor.totalSpent)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Total Spent
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                {vendor.totalOrders}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Orders
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                {vendor.rating}/5
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Rating
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

            {/* Top Products */}
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </div>
                  Top Products
                </CardTitle>
                <CardDescription className="text-xs">
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
                        className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all cursor-pointer border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md"
                      >
                        <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold">
                          {getInitials(product.name)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                              {product.name}
                            </h4>
                            <Badge
                              className={`${statusConfig.color} flex items-center gap-1 text-xs`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                {formatCurrency(product.revenue)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Revenue
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                {product.totalSold}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Sold
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                {product.currentStock}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
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

        {/* Quick Actions - moved to bottom */}
        <div
          className={`transform transition-all duration-700 delay-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-indigo-600" />
                </div>
                Quick Actions
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your supply chain efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <button
                  onClick={() => router.push("/supplier/add-inventory")}
                  className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 hover:shadow-xl cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                      Add Inventory
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      New supply item
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/supplier/vendors")}
                  className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 hover:shadow-xl cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                      Manage Vendors
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Vendor partners
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/supplier/inventory")}
                  className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 hover:shadow-xl cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Warehouse className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                      Check Inventory
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Stock overview
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/supplier/insights")}
                  className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 hover:shadow-xl cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                      View Analytics
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
