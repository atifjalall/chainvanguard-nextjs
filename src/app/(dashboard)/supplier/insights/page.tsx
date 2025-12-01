/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TruckIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  TagIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  UserGroupIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { badgeColors, colors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { usePageTitle } from "@/hooks/use-page-title";
import supplierAnalyticsApi, {
  SupplyData,
  ProductSupplyPerformance,
  VendorData,
  CategoryData,
  AnalyticsMetrics,
  SupplierAnalyticsResponse,
} from "@/lib/api/supplier.analytics.api";

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
      CVT
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

const timeRangeOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 3 Months" },
  { value: "1y", label: "Last Year" },
];

export default function SupplierAnalyticsPage() {
  usePageTitle("Business Insights");
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d"
  );
  const [selectedMetric, setSelectedMetric] = useState<
    "revenue" | "orders" | "vendors"
  >("revenue");
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState("supply");

  // State for real data
  const [analyticsData, setAnalyticsData] =
    useState<SupplierAnalyticsResponse | null>(null);
  const [supplyData, setSupplyData] = useState<SupplyData[]>([]);
  const [productPerformance, setProductPerformance] = useState<
    ProductSupplyPerformance[]
  >([]);
  const [vendorData, setVendorData] = useState<VendorData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    revenue: { value: 0, growth: 0 },
    orders: { value: 0, growth: 0 },
    vendors: { value: 0, growth: 0 },
    avgOrderValue: { value: 0, growth: 0 },
    inventoryValue: { value: 0, growth: 0 },
  });

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const getAxisColor = () => (isDarkMode ? "#9ca3af" : "#6b7280");
  const getGridColor = () => (isDarkMode ? "#374151" : "#e5e7eb");
  const getTextColor = () => (isDarkMode ? "#f9fafb" : "#111827");

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
        border-radius: 0px !important;
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
        border-radius: 0px !important;
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
      console.log("🔄 Loading supplier analytics...");

      // Fetch main analytics data
      const data = await supplierAnalyticsApi.getAnalytics(timeRange);
      setAnalyticsData(data);

      // Transform data for charts
      const transformedSupplyData =
        supplierAnalyticsApi.transformToSupplyData(data);
      setSupplyData(transformedSupplyData);

      // Transform vendor data
      const transformedVendorData =
        supplierAnalyticsApi.transformVendorData(data);
      setVendorData(transformedVendorData);

      // Transform category data
      const transformedCategoryData =
        supplierAnalyticsApi.transformCategoryData(data);
      setCategoryData(transformedCategoryData);

      // Get top products
      const topProducts = data.analytics.topProducts || [];
      const transformedProducts = topProducts.map((item: any) => ({
        id: item._id,
        name: item.name,
        category: item.category || "Uncategorized",
        revenue: item.revenue,
        orders: item.orderCount,
        totalSupplied: item.totalSupplied,
        avgOrderSize: Math.round(item.avgOrderSize),
        stock:
          (item.quantity || 0) -
          (item.reservedQuantity || 0) -
          (item.damagedQuantity || 0) -
          (item.committedQuantity || 0),
        image: item.image || undefined,
      }));
      console.log("Transformed Products:", transformedProducts);
      setProductPerformance(transformedProducts);
      // Calculate metrics with growth
      const calculatedMetrics = await supplierAnalyticsApi.calculateMetrics(
        data,
        timeRange
      );
      setMetrics(calculatedMetrics);

      console.log("✅ Analytics loaded successfully");
      toast.success("Analytics loaded successfully");
    } catch (error: any) {
      console.error("❌ Failed to load supplier analytics:", error);
      toast.error(error.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "CVT",
    }).format(amount);
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
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-none shadow-none p-4">
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
                entry.dataKey === "avgOrderValue" ||
                entry.dataKey === "inventoryValue"
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
  }: {
    title: string;
    value: number;
    growth: number;
    icon: any;
    formatter?: (val: number) => string;
  }) => (
    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 hover:scale-[1.02] rounded-none !shadow-none hover:!shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="h-10 w-10 flex items-center justify-center rounded-none">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          {formatter(value)}
        </div>
        <div className="flex items-center gap-1">
          {growth >= 0 ? (
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
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

  const handleExport = async () => {
    try {
      toast.info("Exporting analytics data...");
      await supplierAnalyticsApi.exportAnalytics("json", "revenue", timeRange);
      toast.success("Analytics exported successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to export analytics");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${colors.backgrounds.secondary} p-6 space-y-6`}
    >
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/supplier">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Analytics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
              Supply Chain Analytics
            </h1>
            <p className={`text-base ${colors.texts.secondary} mt-2`}>
              Track your supply performance and vendor relationships
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
              >
                <ChartBarIcon
                  className={`h-3 w-3 mr-1 ${badgeColors.blue.icon}`}
                />
                Real-time Analytics
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
            <Select
              value={timeRange}
              onValueChange={(value: any) => setTimeRange(value)}
            >
              <SelectTrigger
                className={`w-40 h-10 ${colors.borders.primary} ${colors.backgrounds.primary} text-xs rounded-none`}
              >
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
              className={`flex items-center gap-2 text-xs ${colors.buttons.outline} rounded-none transition-all hover:border-black dark:hover:border-white`}
              onClick={loadAnalytics}
            >
              <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="Total Revenue"
            value={metrics.revenue.value}
            growth={metrics.revenue.growth}
            icon={RsIcon}
            formatter={formatCurrency}
          />
          <MetricCard
            title="Supply Orders"
            value={metrics.orders.value}
            growth={metrics.orders.growth}
            icon={TruckIcon}
          />
          <MetricCard
            title="Active Vendors"
            value={metrics.vendors.value}
            growth={metrics.vendors.growth}
            icon={UsersIcon}
          />
          <MetricCard
            title="Avg Order Value"
            value={metrics.avgOrderValue.value}
            growth={metrics.avgOrderValue.growth}
            icon={TagIcon}
            formatter={formatCurrency}
          />
          <MetricCard
            title="Inventory Value"
            value={metrics.inventoryValue.value}
            growth={metrics.inventoryValue.growth}
            icon={BuildingStorefrontIcon}
            formatter={formatCurrency}
          />
        </div>
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs
          defaultValue="supply"
          value={selectedTab}
          onValueChange={setSelectedTab}
        >
          <TabsList
            className={`flex w-full max-w-2xl border ${colors.borders.primary} ${colors.backgrounds.tertiary} p-0.5 rounded-none mx-auto mb-6`}
          >
            <TabsTrigger
              value="supply"
              className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${
                selectedTab === "supply"
                  ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                  : `${colors.texts.secondary} hover:${colors.texts.primary}`
              } flex items-center gap-2 justify-center`}
            >
              <ArrowTrendingUpIcon
                className={`h-4 w-4 ${colors.icons.primary}`}
              />
              Supply Trends
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${
                selectedTab === "products"
                  ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                  : `${colors.texts.secondary} hover:${colors.texts.primary}`
              } flex items-center gap-2 justify-center`}
            >
              <CubeIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="vendors"
              className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${
                selectedTab === "vendors"
                  ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                  : `${colors.texts.secondary} hover:${colors.texts.primary}`
              } flex items-center gap-2 justify-center`}
            >
              <UsersIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Vendors
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${
                selectedTab === "performance"
                  ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                  : `${colors.texts.secondary} hover:${colors.texts.primary}`
              } flex items-center gap-2 justify-center`}
            >
              <ChartBarIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supply" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={`${colors.cards.base} rounded-none`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle
                        className={`text-base ${colors.texts.primary}`}
                      >
                        Supply Revenue Trend
                      </CardTitle>
                      <CardDescription
                        className={`text-sm ${colors.texts.secondary}`}
                      >
                        Daily supply revenue over time
                      </CardDescription>
                    </div>
                    <Select
                      value={selectedMetric}
                      onValueChange={(value: any) => setSelectedMetric(value)}
                    >
                      <SelectTrigger
                        className={`w-32 h-10 ${colors.borders.primary} ${colors.backgrounds.primary} text-xs rounded-none`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="orders">Orders</SelectItem>
                        <SelectItem value="vendors">Vendors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={supplyData}>
                      <defs>
                        <linearGradient
                          id="colorSupplyRevenue"
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
                        fill="url(#colorSupplyRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className={`${colors.cards.base} rounded-none`}>
                <CardHeader>
                  <CardTitle className={`text-base ${colors.texts.primary}`}>
                    Orders vs Inventory Value
                  </CardTitle>
                  <CardDescription
                    className={`text-sm ${colors.texts.secondary}`}
                  >
                    Supply orders and inventory correlation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={supplyData}>
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
                        name="Supply Orders"
                        dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="inventoryValue"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        name="Inventory Value (CVT)"
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className={`${colors.cards.base} rounded-none mt-6`}>
              <CardHeader>
                <CardTitle className={`text-base ${colors.texts.primary}`}>
                  Average Supply Order Value
                </CardTitle>
                <CardDescription
                  className={`text-sm ${colors.texts.secondary}`}
                >
                  Track how your average B2B order value changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={supplyData}>
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
                    <Bar dataKey="avgOrderValue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-0">
            <Card className={`${colors.cards.base} rounded-none`}>
              <CardHeader>
                <CardTitle className={`text-base ${colors.texts.primary}`}>
                  Top Supply Inventory
                </CardTitle>
                <CardDescription
                  className={`text-sm ${colors.texts.secondary}`}
                >
                  Supply Inventory ranked by revenue and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {productPerformance.map((product, index) => (
                      <div
                        key={product.id}
                        className="group flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-none bg-white/50 dark:bg-gray-900/50 backdrop-blur hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-none flex items-center justify-center text-sm font-bold text-white bg-gray-500`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {product.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {product.category}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-6 text-right">
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
                              {product.totalSupplied}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Total Supplied
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {product.avgOrderSize || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg Order Size
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {product.stock}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Available Stock
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No product data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={`${colors.cards.base} rounded-none mt-6`}>
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  Category Revenue Distribution
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Revenue generated by supply categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData} layout="horizontal">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        formatter={(value: any) => [
                          formatCurrency(value),
                          "Revenue",
                        ]}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={`${colors.cards.base} rounded-none`}>
                <CardHeader>
                  <CardTitle className="text-base text-foreground">
                    Revenue by Vendor
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Distribution of revenue across vendor partners
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vendorData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={vendorData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {vendorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [
                            formatCurrency(value),
                            "Revenue",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No vendor data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={`${colors.cards.base} rounded-none`}>
                <CardHeader>
                  <CardTitle className="text-base text-foreground">
                    Vendor Performance
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Detailed breakdown by vendor partner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vendorData.length > 0 ? (
                    <div className="space-y-4">
                      {vendorData.map((vendor, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: vendor.color }}
                              />
                              <span className="font-medium text-foreground">
                                {vendor.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-foreground">
                                {formatCurrency(vendor.value)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {vendor.orders} orders •{" "}
                                {vendor.percentage.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${vendor.percentage}%`,
                                backgroundColor: vendor.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No vendor data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <Card className={`${colors.cards.base} rounded-none`}>
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  Supply Chain Insights
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  AI-powered recommendations to optimize your supply operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.revenue.growth > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-none">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                          Excellent Supply Performance
                        </h4>
                        <p className="text-xs text-green-700 dark:text-green-400">
                          Your supply revenue increased by{" "}
                          {metrics.revenue.growth.toFixed(1)}% this period. Keep
                          up the great work!
                        </p>
                      </div>
                    </div>
                  )}

                  {vendorData.length > 0 && vendorData[0].percentage > 30 && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-none">
                      <GlobeAltIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Expansion Opportunity
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          {vendorData[0].name} accounts for{" "}
                          {vendorData[0].percentage.toFixed(1)}% of your
                          revenue. Consider diversifying your vendor base.
                        </p>
                      </div>
                    </div>
                  )}

                  {analyticsData &&
                    analyticsData.analytics.inventoryStats.overall
                      .lowStockItems > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-none">
                        <AdjustmentsHorizontalIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                            Inventory Optimization
                          </h4>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400">
                            {
                              analyticsData.analytics.inventoryStats.overall
                                .lowStockItems
                            }{" "}
                            items running low on stock. Consider increasing
                            inventory levels.
                          </p>
                        </div>
                      </div>
                    )}

                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-none">
                    <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Vendor Relationships
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        Maintain strong partnerships by providing quality
                        inventory and reliable delivery.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${colors.cards.base} rounded-none mt-6`}>
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  Supply Chain Goals
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Track your progress toward quarterly supply targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Quarterly Revenue Goal
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(metrics.revenue.value)} /{" "}
                        {formatCurrency(10000000)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-none h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-none transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (metrics.revenue.value / 10000000) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((metrics.revenue.value / 10000000) * 100).toFixed(1)}%
                      completed
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Vendor Partnerships
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {metrics.vendors.value} / 500
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-none h-2">
                      <div
                        className="bg-green-500 h-2 rounded-none transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (metrics.vendors.value / 500) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((metrics.vendors.value / 500) * 100).toFixed(1)}%
                      completed
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Supply Orders
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {metrics.orders.value} / 5000
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-none h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-none transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (metrics.orders.value / 5000) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((metrics.orders.value / 5000) * 100).toFixed(1)}%
                      completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card
          className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
        >
          <CardHeader>
            <CardTitle
              className={`text-base flex items-center gap-3 ${colors.texts.primary}`}
            >
              <div className="h-8 w-8 flex items-center justify-center rounded-none">
                <ChartBarIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className={`text-sm ${colors.texts.secondary}`}>
              Common supply chain actions based on your analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <button
                className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none`}
              >
                <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-none">
                  <PlusIcon className={`h-6 w-6 ${colors.texts.primary}`} />
                </div>
                <div className="text-center">
                  <p
                    className={`font-semibold ${colors.texts.primary} text-xs`}
                  >
                    Add Supply Product
                  </p>
                  <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                    Expand catalog
                  </p>
                </div>
              </button>
              <button
                className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none`}
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
                    Partner relationships
                  </p>
                </div>
              </button>
              <button
                className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none`}
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
                    Stock levels
                  </p>
                </div>
              </button>
              <button
                className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none`}
                onClick={handleExport}
              >
                <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-none">
                  <ArrowDownTrayIcon
                    className={`h-6 w-6 ${colors.texts.primary}`}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={`font-semibold ${colors.texts.primary} text-xs`}
                  >
                    Export Report
                  </p>
                  <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                    Supply chain data
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
