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

interface DashboardMetrics {
  totalProducts: number;
  totalVendors: number;
  totalTransactions: number;
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
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
  const [products, setProducts] = useState<Product[]>([]);
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

      // Load products
      const savedProducts = localStorage.getItem(
        `supplier_${user?.id}_products`
      );
      const productsData = savedProducts ? JSON.parse(savedProducts) : [];

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

      setProducts(productsData);
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
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === "active").length;
    const lowStockProducts = products.filter(
      (p) => p.quantity < (p.minimumOrderQuantity || 10) * 2
    ).length;
    const outOfStockProducts = products.filter((p) => p.quantity === 0).length;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.price * p.quantity,
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
      totalProducts,
      totalVendors,
      totalTransactions,
      totalRevenue,
      totalOrders,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      pendingVendors,
      completedTransactions,
      totalInventoryValue,
      avgOrderValue,
    };
  }, [products, vendors, transactions]);

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-sm"></div>
        </div>
      </div>
    );
  }

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
              Supply Chain Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Manage your inventory, vendors, and supply operations
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <Factory className="h-3 w-3 mr-1" />
                Supply Chain
              </Badge>
              <Badge variant="outline" className="border-gray-300">
                <Shield className="h-3 w-3 mr-1" />
                Blockchain Secured
              </Badge>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <Package className="h-3 w-3 mr-1" />
                {metrics.totalProducts} Products
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedTimeRange}
              onValueChange={setSelectedTimeRange}
            >
              <SelectTrigger className="w-40 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 3 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadDashboardData}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setIsAddProductOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
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
              gradient: "from-green-500 to-emerald-500",
              bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
              trend: "up",
            },
            {
              title: "Active Vendors",
              value: metrics.totalVendors || mockTopVendors.length,
              subtitle: `${metrics.pendingVendors || 1} pending`,
              icon: Users,
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
              trend: "up",
            },
            {
              title: "Total Products",
              value: metrics.totalProducts || mockTopProducts.length,
              subtitle: `${metrics.activeProducts || 3} active`,
              icon: Package,
              gradient: "from-purple-500 to-indigo-500",
              bgGradient: "from-purple-500/5 via-transparent to-indigo-500/5",
              trend: "neutral",
            },
            {
              title: "Inventory Value",
              value: formatCurrency(metrics.totalInventoryValue || 137000),
              subtitle: "Current stock value",
              icon: Warehouse,
              gradient: "from-orange-500 to-amber-500",
              bgGradient: "from-orange-500/5 via-transparent to-amber-500/5",
              trend: "up",
            },
            {
              title: "Low Stock Items",
              value: metrics.lowStockProducts || 2,
              subtitle: "Need reordering",
              icon: AlertTriangle,
              gradient: "from-red-500 to-pink-500",
              bgGradient: "from-red-500/5 via-transparent to-pink-500/5",
              trend: "down",
            },
            {
              title: "Avg Order Value",
              value: formatCurrency(metrics.avgOrderValue || 1547),
              subtitle: "+3.8% vs last month",
              icon: Target,
              gradient: "from-yellow-500 to-amber-500",
              bgGradient: "from-yellow-500/5 via-transparent to-amber-500/5",
              trend: "up",
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
                  <div className="flex items-center gap-1">
                    {stat.trend === "up" && (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    )}
                    {stat.trend === "down" && (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {stat.subtitle}
                    </p>
                  </div>
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-lg" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest updates from your supply chain
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  {recentActivity.slice(0, 6).map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-300"
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
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                    variant="outline"
                    onClick={() => router.push("/supplier/transactions")}
                    className="shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    View All Transactions
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Performance Overview */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 rounded-lg" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Revenue Goal
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
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
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Vendor Satisfaction
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
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
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Stock Turnover
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
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

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 rounded-lg" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/supplier/add-product")}
                    className="h-auto p-3 flex-col gap-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur hover:bg-white/70 dark:hover:bg-gray-900/70"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">Add Product</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/supplier/vendors")}
                    className="h-auto p-3 flex-col gap-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur hover:bg-white/70 dark:hover:bg-gray-900/70"
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Manage Vendors</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/supplier/inventory")}
                    className="h-auto p-3 flex-col gap-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur hover:bg-white/70 dark:hover:bg-gray-900/70"
                  >
                    <Warehouse className="h-4 w-4" />
                    <span className="text-xs">Check Inventory</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/supplier/insights")}
                    className="h-auto p-3 flex-col gap-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur hover:bg-white/70 dark:hover:bg-gray-900/70"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs">View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div
        className={`transform transition-all duration-700 delay-600 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Vendors */}
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 rounded-lg" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                Top Vendors
              </CardTitle>
              <CardDescription>
                Your highest performing vendor partners
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {mockTopVendors.map((vendor, index) => {
                  const statusConfig = getStatusConfig(vendor.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div
                      key={vendor.id}
                      className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-300"
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-lg">
                          <AvatarImage src="" alt={vendor.name} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                            {getInitials(vendor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1">
                          {index === 0 && (
                            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center">
                              <Crown className="h-3 w-3 text-white" />
                            </div>
                          )}
                          {index === 1 && (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center">
                              <Award className="h-2 w-2 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {vendor.name}
                          </h4>
                          <Badge
                            className={`${statusConfig.color} flex items-center gap-1 text-xs`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(vendor.totalSpent)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Total Spent
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {vendor.totalOrders}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Orders
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
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
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 rounded-lg" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Top Products
              </CardTitle>
              <CardDescription>
                Your best performing supply items
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {mockTopProducts.map((product) => {
                  const statusConfig = getStatusConfig(product.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-300"
                    >
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold">
                        {getInitials(product.name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {product.name}
                          </h4>
                          <Badge
                            className={`${statusConfig.color} flex items-center gap-1 text-xs`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(product.revenue)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Revenue
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {product.totalSold}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Sold
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
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

      {/* Add Product Dialog */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Add New Product
            </DialogTitle>
            <DialogDescription>
              Add a new product to your supply catalog. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  className="border-gray-300 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger className="border-gray-300 dark:border-gray-700">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw-materials">Raw Materials</SelectItem>
                    <SelectItem value="electronics">
                      Electronics Components
                    </SelectItem>
                    <SelectItem value="textiles">Textiles & Fabrics</SelectItem>
                    <SelectItem value="machinery">
                      Machinery & Equipment
                    </SelectItem>
                    <SelectItem value="chemicals">
                      Chemicals & Materials
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                className="border-gray-300 dark:border-gray-700 min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  className="border-gray-300 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  className="border-gray-300 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-order">Minimum Order</Label>
                <Input
                  id="min-order"
                  type="number"
                  placeholder="0"
                  className="border-gray-300 dark:border-gray-700"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddProductOpen(false)}
              className="border-gray-300 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
