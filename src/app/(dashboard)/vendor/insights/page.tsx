/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Badge } from "@/components/_ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/_ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/_ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Star,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Target,
  Clock,
  Award,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Filter,
  Sparkles,
  Shield,
  Crown,
  TrendingDown as TrendingDownIcon,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

// Analytics data interfaces
interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
}

interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  revenue: number;
  orders: number;
  views: number;
  conversionRate: number;
  stock: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface CustomerMetrics {
  newCustomers: number;
  returningCustomers: number;
  customerRetention: number;
  averageLifetimeValue: number;
}

// Mock analytics data
const mockSalesData: SalesData[] = [
  {
    date: "2025-08-01",
    revenue: 1250,
    orders: 8,
    customers: 6,
    avgOrderValue: 156.25,
  },
  {
    date: "2025-08-02",
    revenue: 980,
    orders: 6,
    customers: 5,
    avgOrderValue: 163.33,
  },
  {
    date: "2025-08-03",
    revenue: 1680,
    orders: 12,
    customers: 9,
    avgOrderValue: 140.0,
  },
  {
    date: "2025-08-04",
    revenue: 890,
    orders: 5,
    customers: 4,
    avgOrderValue: 178.0,
  },
  {
    date: "2025-08-05",
    revenue: 2150,
    orders: 15,
    customers: 12,
    avgOrderValue: 143.33,
  },
  {
    date: "2025-08-06",
    revenue: 1450,
    orders: 9,
    customers: 7,
    avgOrderValue: 161.11,
  },
  {
    date: "2025-08-07",
    revenue: 1890,
    orders: 11,
    customers: 8,
    avgOrderValue: 171.82,
  },
  {
    date: "2025-08-08",
    revenue: 2340,
    orders: 16,
    customers: 13,
    avgOrderValue: 146.25,
  },
  {
    date: "2025-08-09",
    revenue: 1120,
    orders: 7,
    customers: 6,
    avgOrderValue: 160.0,
  },
  {
    date: "2025-08-10",
    revenue: 1780,
    orders: 10,
    customers: 8,
    avgOrderValue: 178.0,
  },
  {
    date: "2025-08-11",
    revenue: 2560,
    orders: 18,
    customers: 14,
    avgOrderValue: 142.22,
  },
  {
    date: "2025-08-12",
    revenue: 1340,
    orders: 8,
    customers: 7,
    avgOrderValue: 167.5,
  },
  {
    date: "2025-08-13",
    revenue: 1950,
    orders: 13,
    customers: 10,
    avgOrderValue: 150.0,
  },
  {
    date: "2025-08-14",
    revenue: 2780,
    orders: 19,
    customers: 15,
    avgOrderValue: 146.32,
  },
  {
    date: "2025-08-15",
    revenue: 2100,
    orders: 14,
    customers: 11,
    avgOrderValue: 150.0,
  },
  {
    date: "2025-08-16",
    revenue: 1680,
    orders: 9,
    customers: 7,
    avgOrderValue: 186.67,
  },
];

const mockProductPerformance: ProductPerformance[] = [
  {
    id: "1",
    name: "Wireless Gaming Mouse",
    category: "Electronics",
    revenue: 3599.6,
    orders: 40,
    views: 1250,
    conversionRate: 3.2,
    stock: 25,
  },
  {
    id: "2",
    name: "Bluetooth Headphones",
    category: "Electronics",
    revenue: 2999.75,
    orders: 15,
    views: 890,
    conversionRate: 1.7,
    stock: 12,
  },
  {
    id: "3",
    name: "Smart Watch Pro",
    category: "Electronics",
    revenue: 5999.85,
    orders: 20,
    views: 1580,
    conversionRate: 1.3,
    stock: 8,
  },
  {
    id: "4",
    name: "USB-C Hub",
    category: "Electronics",
    revenue: 1499.7,
    orders: 30,
    views: 750,
    conversionRate: 4.0,
    stock: 45,
  },
  {
    id: "5",
    name: "Laptop Stand",
    category: "Accessories",
    revenue: 1599.2,
    orders: 20,
    views: 520,
    conversionRate: 3.8,
    stock: 18,
  },
];

const mockCategoryData: CategoryData[] = [
  { name: "Electronics", value: 14099, percentage: 65.2, color: "#3B82F6" },
  { name: "Accessories", value: 3499, percentage: 16.2, color: "#10B981" },
  { name: "Gaming", value: 2899, percentage: 13.4, color: "#8B5CF6" },
  { name: "Office", value: 1099, percentage: 5.2, color: "#F59E0B" },
];

const timeRangeOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 3 Months" },
  { value: "1y", label: "Last Year" },
];

export default function VendorAnalyticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState<
    "revenue" | "orders" | "customers"
  >("revenue");
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Get colors based on theme
  const getAxisColor = () => (isDarkMode ? "#9ca3af" : "#6b7280"); // gray-400 : gray-500
  const getGridColor = () => (isDarkMode ? "#374151" : "#e5e7eb"); // gray-700 : gray-200
  const getTextColor = () => (isDarkMode ? "#f9fafb" : "#111827"); // gray-50 : gray-900

  // Enhanced CSS for dark mode
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "recharts-dark-mode-fix";
    style.textContent = `
      .recharts-text {
        fill: ${getTextColor()} !important;
      }
      .recharts-cartesian-axis-tick-value {
        fill: ${getAxisColor()} !important;
      }
      .recharts-legend-item-text {
        color: ${getTextColor()} !important;
        fill: ${getTextColor()} !important;
      }
      .recharts-default-tooltip {
        background-color: ${isDarkMode ? "#1f2937" : "#ffffff"} !important;
        border: 1px solid ${isDarkMode ? "#374151" : "#e5e7eb"} !important;
        color: ${getTextColor()} !important;
        border-radius: 8px !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, ${isDarkMode ? "0.3" : "0.1"}), 0 8px 10px -6px rgba(0, 0, 0, ${isDarkMode ? "0.2" : "0.1"}) !important;
      }
      .recharts-cartesian-axis-line {
        stroke: ${getAxisColor()} !important;
        opacity: 0.5 !important;
      }
      .recharts-cartesian-grid-horizontal line,
      .recharts-cartesian-grid-vertical line {
        stroke: ${getGridColor()} !important;
        opacity: 0.3 !important;
      }
      .recharts-tooltip-wrapper .recharts-default-tooltip {
        background-color: ${isDarkMode ? "#1f2937" : "#ffffff"} !important;
        border: 1px solid ${isDarkMode ? "#374151" : "#e5e7eb"} !important;
        border-radius: 8px !important;
        color: ${getTextColor()} !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, ${isDarkMode ? "0.3" : "0.1"}), 0 8px 10px -6px rgba(0, 0, 0, ${isDarkMode ? "0.2" : "0.1"}) !important;
        backdrop-filter: blur(12px) !important;
      }
      .recharts-tooltip-label {
        color: ${getTextColor()} !important;
      }
      .recharts-tooltip-item-name,
      .recharts-tooltip-item-value {
        color: ${getTextColor()} !important;
      }
      .recharts-layer .recharts-reference-line-line {
        stroke: ${getGridColor()} !important;
      }
    `;

    // Remove existing style if it exists
    const existingStyle = document.getElementById("recharts-dark-mode-fix");
    if (existingStyle) {
      existingStyle.remove();
    }

    document.head.appendChild(style);

    return () => {
      const styleToRemove = document.getElementById("recharts-dark-mode-fix");
      if (styleToRemove && document.head.contains(styleToRemove)) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, [isDarkMode]);

  useEffect(() => {
    setIsVisible(true);
    loadAnalytics();
  }, [user?.id, timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In real app: const analytics = await fetchVendorAnalytics(user.id, timeRange);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const currentPeriodData = useMemo(() => {
    const totalRevenue = mockSalesData.reduce(
      (sum, day) => sum + day.revenue,
      0
    );
    const totalOrders = mockSalesData.reduce((sum, day) => sum + day.orders, 0);
    const totalCustomers = mockSalesData.reduce(
      (sum, day) => sum + day.customers,
      0
    );
    const avgOrderValue = totalRevenue / totalOrders;

    // Calculate growth (mock comparison with previous period)
    const revenueGrowth = 12.5;
    const ordersGrowth = 8.3;
    const customersGrowth = 15.2;
    const aovGrowth = 3.8;

    return {
      revenue: { value: totalRevenue, growth: revenueGrowth },
      orders: { value: totalOrders, growth: ordersGrowth },
      customers: { value: totalCustomers, growth: customersGrowth },
      avgOrderValue: { value: avgOrderValue, growth: aovGrowth },
    };
  }, [timeRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.dataKey}:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {entry.dataKey === "revenue" ||
                entry.dataKey === "avgOrderValue"
                  ? formatCurrency(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const MetricCard = ({
    title,
    value,
    growth,
    icon: Icon,
    formatter = (val: number) => val.toString(),
    gradient,
    bgGradient,
  }: {
    title: string;
    value: number;
    growth: number;
    icon: any;
    formatter?: (val: number) => string;
    gradient: string;
    bgGradient: string;
  }) => (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div
          className={`h-10 w-10 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {formatter(value)}
        </div>
        <div className="flex items-center gap-1">
          {growth >= 0 ? (
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${
              growth >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {Math.abs(growth).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            vs last period
          </span>
        </div>
      </CardContent>
    </Card>
  );

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
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Track your sales performance and business insights
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <BarChart3 className="h-3 w-3 mr-1" />
                Real-time Analytics
              </Badge>
              <Badge variant="outline" className="border-gray-300">
                <Shield className="h-3 w-3 mr-1" />
                Blockchain Secured
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Insights
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              size="sm"
              onClick={loadAnalytics}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div
        className={`transform transition-all duration-700 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={currentPeriodData.revenue.value}
            growth={currentPeriodData.revenue.growth}
            icon={DollarSign}
            formatter={formatCurrency}
            gradient="from-green-500 to-emerald-500"
            bgGradient="from-green-500/5 via-transparent to-emerald-500/5"
          />
          <MetricCard
            title="Total Orders"
            value={currentPeriodData.orders.value}
            growth={currentPeriodData.orders.growth}
            icon={ShoppingCart}
            gradient="from-blue-500 to-cyan-500"
            bgGradient="from-blue-500/5 via-transparent to-cyan-500/5"
          />
          <MetricCard
            title="Unique Customers"
            value={currentPeriodData.customers.value}
            growth={currentPeriodData.customers.growth}
            icon={Users}
            gradient="from-purple-500 to-indigo-500"
            bgGradient="from-purple-500/5 via-transparent to-indigo-500/5"
          />
          <MetricCard
            title="Avg Order Value"
            value={currentPeriodData.avgOrderValue.value}
            growth={currentPeriodData.avgOrderValue.growth}
            icon={Target}
            formatter={formatCurrency}
            gradient="from-orange-500 to-amber-500"
            bgGradient="from-orange-500/5 via-transparent to-amber-500/5"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div
        className={`transform transition-all duration-700 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Tabs defaultValue="sales" className="space-y-6">
          <div className="flex items-center justify-center">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur border-gray-200 dark:border-gray-700">
              <TabsTrigger
                value="sales"
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <BarChart3 className="h-4 w-4" />
                Sales Trends
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Package className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <PieChartIcon className="h-4 w-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Activity className="h-4 w-4" />
                Performance
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900 dark:text-gray-100">
                        Revenue Trend
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Daily revenue over time
                      </CardDescription>
                    </div>
                    <Select
                      value={selectedMetric}
                      onValueChange={(value: any) => setSelectedMetric(value)}
                    >
                      <SelectTrigger className="w-32 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="orders">Orders</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockSalesData}>
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3B82F6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3B82F6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={getGridColor()}
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        axisLine={{ stroke: getAxisColor() }}
                        tickLine={{ stroke: getAxisColor() }}
                        tick={{ fill: getAxisColor(), fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={{ stroke: getAxisColor() }}
                        tickLine={{ stroke: getAxisColor() }}
                        tick={{ fill: getAxisColor(), fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey={selectedMetric}
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Orders vs Revenue */}
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5" />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gray-900 dark:text-gray-100">
                    Orders vs Revenue
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Order volume and revenue correlation
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockSalesData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={getGridColor()}
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        axisLine={{ stroke: getAxisColor() }}
                        tickLine={{ stroke: getAxisColor() }}
                        tick={{ fill: getAxisColor(), fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={{ stroke: getAxisColor() }}
                        tickLine={{ stroke: getAxisColor() }}
                        tick={{ fill: getAxisColor(), fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={{ stroke: getAxisColor() }}
                        tickLine={{ stroke: getAxisColor() }}
                        tick={{ fill: getAxisColor(), fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="orders"
                        stroke="#10B981"
                        strokeWidth={3}
                        name="Orders"
                        dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        name="Revenue ($)"
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Average Order Value */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  Average Order Value Trend
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Track how your average order value changes over time
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockSalesData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={getGridColor()}
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      axisLine={{ stroke: getAxisColor() }}
                      tickLine={{ stroke: getAxisColor() }}
                      tick={{ fill: getAxisColor(), fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={{ stroke: getAxisColor() }}
                      tickLine={{ stroke: getAxisColor() }}
                      tick={{ fill: getAxisColor(), fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="avgOrderValue"
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  Top Performing Products
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Products ranked by revenue and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  {mockProductPerformance.map((product, index) => (
                    <div
                      key={product.id}
                      className="group flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                            index === 0
                              ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                              : index === 1
                                ? "bg-gradient-to-r from-gray-400 to-gray-500"
                                : index === 2
                                  ? "bg-gradient-to-r from-orange-500 to-red-500"
                                  : "bg-gradient-to-r from-blue-500 to-cyan-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {product.category}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-8 text-right">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(product.revenue)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Revenue
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {product.orders}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Orders
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {product.views}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Views
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {product.conversionRate}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Conversion
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Product Performance Chart */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  Product Revenue Comparison
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Revenue generated by each product
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockProductPerformance} layout="horizontal">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={getGridColor()}
                      opacity={0.3}
                    />
                    <XAxis
                      type="number"
                      axisLine={{ stroke: getAxisColor() }}
                      tickLine={{ stroke: getAxisColor() }}
                      tick={{ fill: getAxisColor(), fontSize: 12 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={150}
                      axisLine={{ stroke: getAxisColor() }}
                      tickLine={{ stroke: getAxisColor() }}
                      tick={{ fill: getAxisColor(), fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: any) => [
                        formatCurrency(value),
                        "Revenue",
                      ]}
                      contentStyle={{
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "8px",
                        color: getTextColor(),
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#3B82F6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Pie Chart */}
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gray-900 dark:text-gray-100">
                    Revenue by Category
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Distribution of revenue across product categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={mockCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {mockCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [
                          formatCurrency(value),
                          "Revenue",
                        ]}
                        contentStyle={{
                          backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                          border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          borderRadius: "8px",
                          color: getTextColor(),
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-rose-500/5" />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gray-900 dark:text-gray-100">
                    Category Performance
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Detailed breakdown by category
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    {mockCategoryData.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {category.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {formatCurrency(category.value)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {category.percentage}%
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${category.percentage}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Performance Metrics */}
              {[
                {
                  title: "Conversion Rate",
                  value: "2.8%",
                  change: "+0.3%",
                  icon: Target,
                  gradient: "from-green-500 to-emerald-500",
                  bg: "from-green-500/5 via-transparent to-emerald-500/5",
                },
                {
                  title: "Page Views",
                  value: "8,950",
                  change: "+12%",
                  icon: Eye,
                  gradient: "from-blue-500 to-cyan-500",
                  bg: "from-blue-500/5 via-transparent to-cyan-500/5",
                },
                {
                  title: "Customer Rating",
                  value: "4.7",
                  change: "+0.1",
                  icon: Star,
                  gradient: "from-yellow-500 to-amber-500",
                  bg: "from-yellow-500/5 via-transparent to-amber-500/5",
                },
                {
                  title: "Response Time",
                  value: "2.4h",
                  change: "-0.6h",
                  icon: Clock,
                  gradient: "from-purple-500 to-indigo-500",
                  bg: "from-purple-500/5 via-transparent to-indigo-500/5",
                },
              ].map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <Card
                    key={index}
                    className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl group"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${metric.bg}`}
                    />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {metric.title}
                      </CardTitle>
                      <div
                        className={`h-10 w-10 rounded-full bg-gradient-to-r ${metric.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {metric.value}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <span
                          className={`font-medium ${metric.change.startsWith("+") || metric.change.startsWith("-0") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {metric.change}
                        </span>{" "}
                        vs last period
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Performance Insights */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  AI-Powered Performance Insights
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Smart recommendations to improve your business performance
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  {[
                    {
                      type: "success",
                      icon: TrendingUp,
                      title: "Strong Performance",
                      message:
                        "Your conversion rate increased by 15% this month. Consider expanding your top-performing Electronics category.",
                      gradient: "from-green-500/10 to-emerald-500/10",
                      border: "border-green-200 dark:border-green-800",
                      text: "text-green-800 dark:text-green-300",
                    },
                    {
                      type: "info",
                      icon: Zap,
                      title: "Optimization Opportunity",
                      message:
                        "Products in the Accessories category have high views but low conversion. Consider adjusting pricing or product descriptions.",
                      gradient: "from-blue-500/10 to-cyan-500/10",
                      border: "border-blue-200 dark:border-blue-800",
                      text: "text-blue-800 dark:text-blue-300",
                    },
                    {
                      type: "warning",
                      icon: Award,
                      title: "Customer Satisfaction",
                      message:
                        "Your average rating of 4.7/5 is excellent! Maintain quality standards to keep customers happy.",
                      gradient: "from-orange-500/10 to-amber-500/10",
                      border: "border-orange-200 dark:border-orange-800",
                      text: "text-orange-800 dark:text-orange-300",
                    },
                    {
                      type: "alert",
                      icon: Target,
                      title: "Inventory Alert",
                      message:
                        "Smart Watch Pro is running low on stock (8 units). Consider restocking soon to avoid stockouts.",
                      gradient: "from-purple-500/10 to-indigo-500/10",
                      border: "border-purple-200 dark:border-purple-800",
                      text: "text-purple-800 dark:text-purple-300",
                    },
                  ].map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                      <div
                        key={index}
                        className={`flex items-start gap-4 p-4 bg-gradient-to-r ${insight.gradient} border ${insight.border} rounded-lg backdrop-blur`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full bg-gradient-to-r ${insight.type === "success" ? "from-green-500 to-emerald-500" : insight.type === "info" ? "from-blue-500 to-cyan-500" : insight.type === "warning" ? "from-orange-500 to-amber-500" : "from-purple-500 to-indigo-500"} flex items-center justify-center shadow-lg`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${insight.text} mb-1`}>
                            {insight.title}
                          </h4>
                          <p
                            className={`text-sm ${insight.text.replace("800", "700").replace("300", "400")}`}
                          >
                            {insight.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Goals & Targets */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-pink-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  Goals & Targets
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Track your progress toward monthly and quarterly goals
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-6">
                  {[
                    {
                      label: "Monthly Revenue Goal",
                      current: currentPeriodData.revenue.value,
                      target: 30000,
                      color: "bg-blue-500",
                      gradient: "from-blue-500 to-cyan-500",
                    },
                    {
                      label: "Customer Acquisition",
                      current: currentPeriodData.customers.value,
                      target: 200,
                      color: "bg-green-500",
                      gradient: "from-green-500 to-emerald-500",
                    },
                    {
                      label: "Order Volume",
                      current: currentPeriodData.orders.value,
                      target: 300,
                      color: "bg-purple-500",
                      gradient: "from-purple-500 to-indigo-500",
                    },
                  ].map((goal, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {goal.label}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {index === 0
                            ? formatCurrency(goal.current)
                            : goal.current}{" "}
                          /{" "}
                          {index === 0
                            ? formatCurrency(goal.target)
                            : goal.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                        <div
                          className={`bg-gradient-to-r ${goal.gradient} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`}
                          style={{
                            width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {((goal.current / goal.target) * 100).toFixed(1)}%
                        completed
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions */}
      <div
        className={`transform transition-all duration-700 delay-600 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-gray-500/5" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-slate-500 to-gray-600 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Common actions based on your analytics insights
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Add Product",
                  sublabel: "Expand inventory",
                  icon: Package,
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  label: "View Customers",
                  sublabel: "Manage relationships",
                  icon: Users,
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  label: "Check Orders",
                  sublabel: "Process pending",
                  icon: ShoppingCart,
                  gradient: "from-purple-500 to-indigo-500",
                },
                {
                  label: "Export Report",
                  sublabel: "Download data",
                  icon: Download,
                  gradient: "from-orange-500 to-amber-500",
                },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="group justify-start h-auto p-4 flex-col gap-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur hover:bg-white/70 dark:hover:bg-gray-900/70 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                  >
                    <div
                      className={`h-10 w-10 rounded-full bg-gradient-to-r ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {action.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {action.sublabel}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
