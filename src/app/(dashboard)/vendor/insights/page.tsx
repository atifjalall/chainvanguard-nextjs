/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
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
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UsersIcon,
  CubeIcon,
  StarIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  EyeIcon,
  TagIcon,
  ClockIcon,
  TrophyIcon,
  BoltIcon,
  ChartBarIcon,
  ChartPieIcon,
  PauseIcon,
  SparklesIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { badgeColors, colors } from "@/lib/colorConstants";
import { usePageTitle } from "@/hooks/use-page-title";
import vendorAnalyticsApi, {
  SalesData,
  ProductPerformance,
  CustomerData,
  CategoryData,
  AnalyticsMetrics,
  VendorAnalyticsResponse,
} from "@/lib/api/vendor.analytics.api";

const timeRangeOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 3 Months" },
  { value: "1y", label: "Last Year" },
];

export default function VendorAnalyticsPage() {
  usePageTitle("Business Insights");
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d"
  );
  const [selectedMetric, setSelectedMetric] = useState<
    "revenue" | "orders" | "customers"
  >("revenue");
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState("sales");

  // State for real data
  const [analyticsData, setAnalyticsData] =
    useState<VendorAnalyticsResponse | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productPerformance, setProductPerformance] = useState<
    ProductPerformance[]
  >([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    revenue: { value: 0, growth: 0 },
    orders: { value: 0, growth: 0 },
    customers: { value: 0, growth: 0 },
    avgOrderValue: { value: 0, growth: 0 },
  });

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
      console.log("🔄 Loading vendor analytics...");

      // Fetch main analytics data
      const data = await vendorAnalyticsApi.getAnalytics(timeRange);
      setAnalyticsData(data);

      // Transform data for charts
      const transformedSalesData =
        vendorAnalyticsApi.transformToSalesData(data);
      setSalesData(transformedSalesData);

      // Transform customer data
      const transformedCustomerData =
        vendorAnalyticsApi.transformCustomerData(data);
      setCustomerData(transformedCustomerData);

      // Transform category data
      const transformedCategoryData =
        vendorAnalyticsApi.transformCategoryData(data);
      setCategoryData(transformedCategoryData);

      // Transform product performance data
      const transformedProductPerformance =
        vendorAnalyticsApi.transformProductPerformance(data);
      setProductPerformance(transformedProductPerformance);

      // Calculate metrics with growth
      const calculatedMetrics = await vendorAnalyticsApi.calculateMetrics(
        data,
        timeRange
      );
      setMetrics(calculatedMetrics);

      console.log("✅ Analytics loaded successfully");
      toast.success("Analytics loaded successfully");
    } catch (error: any) {
      console.error("❌ Failed to load vendor analytics:", error);
      toast.error(error.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `CVT ${value.toLocaleString("en-US")}`;
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
            <ArrowDownRightIcon className="h-4 w-4 text-red-500" />
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
    <div
      className={`min-h-screen ${colors.backgrounds.secondary} p-6 space-y-6`}
    >
      {/* Breadcrumb */}
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/vendor">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Insights</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
              Analytics Dashboard
            </h1>
            <p className={`text-base ${colors.texts.secondary} mt-2`}>
              Track your sales performance and business insights
            </p>
            <div className="flex items-center gap-2 mt-3">
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
              className={`flex items-center gap-2 text-xs ${colors.buttons.outline} rounded-none`}
              onClick={loadAnalytics}
            >
              <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              className={`flex items-center gap-2 text-xs ${colors.buttons.outline} rounded-none`}
            >
              <ArrowDownTrayIcon
                className={`h-4 w-4 ${colors.icons.primary}`}
              />
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
            value={metrics.revenue.value}
            growth={metrics.revenue.growth}
            icon={CurrencyDollarIcon}
            formatter={formatCurrency}
          />
          <MetricCard
            title="Total Orders"
            value={metrics.orders.value}
            growth={metrics.orders.growth}
            icon={ShoppingCartIcon}
          />
          <MetricCard
            title="Unique Customers"
            value={metrics.customers.value}
            growth={metrics.customers.growth}
            icon={UsersIcon}
          />
          <MetricCard
            title="Avg Order Value"
            value={metrics.avgOrderValue.value}
            growth={metrics.avgOrderValue.growth}
            icon={TagIcon}
            formatter={formatCurrency}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div
        className={`transform transition-all duration-700 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Tabs
          defaultValue="sales"
          value={selectedTab}
          onValueChange={setSelectedTab}
        >
          <TabsList
            className={`flex w-full max-w-2xl border ${colors.borders.primary} ${colors.backgrounds.tertiary} p-0.5 rounded-none mx-auto mb-6`}
          >
            <TabsTrigger
              value="sales"
              className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${
                selectedTab === "sales"
                  ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                  : `${colors.texts.secondary} hover:${colors.texts.primary}`
              } flex items-center gap-2 justify-center`}
            >
              <ArrowTrendingUpIcon
                className={`h-4 w-4 ${colors.icons.primary}`}
              />
              Sales Trends
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
              Products
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${
                selectedTab === "categories"
                  ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                  : `${colors.texts.secondary} hover:${colors.texts.primary}`
              } flex items-center gap-2 justify-center`}
            >
              <Squares2X2Icon className={`h-4 w-4 ${colors.icons.primary}`} />
              Categories
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

          <TabsContent value="sales" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                        Revenue Trend
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                        Daily revenue over time
                      </CardDescription>
                    </div>
                    <Select
                      value={selectedMetric}
                      onValueChange={(value: any) => setSelectedMetric(value)}
                    >
                      <SelectTrigger className="w-32 h-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs rounded-none">
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
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={salesData}>
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

              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none">
                <CardHeader>
                  <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                    Orders vs Revenue
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Order volume and revenue correlation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
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

            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none mt-6">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                  Average Order Value Trend
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Track how your average order value changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
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
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                  Top Performing Products
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Products ranked by revenue and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productPerformance.map((product, index) => (
                    <div
                      key={product._id}
                      className="group flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-none bg-white/50 dark:bg-gray-900/50 backdrop-blur hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-none flex items-center justify-center text-sm font-bold text-white bg-gray-500">
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
                            {product.orderCount}
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

            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none mt-6">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                  Product Revenue Comparison
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Revenue generated by each product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productPerformance} layout="horizontal">
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
                        borderRadius: "0px",
                        color: getTextColor(),
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none">
                <CardHeader>
                  <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                    Revenue by Category
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Distribution of revenue across product categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
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
                          borderRadius: "0px",
                          color: getTextColor(),
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none">
                <CardHeader>
                  <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                    Category Performance
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Detailed breakdown by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {category.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(category.value)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {category.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-none h-2">
                          <div
                            className="h-2 rounded-none transition-all duration-300"
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

          <TabsContent value="performance" className="mt-0">
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                  Performance Insights
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  AI-powered recommendations to improve your business
                  performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-none">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                        Strong Performance
                      </h4>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        Your revenue increased by{" "}
                        {metrics.revenue.growth.toFixed(1)}% this period. Keep
                        up the great work!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-none">
                    <BoltIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Optimization Opportunity
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        Products in the Accessories category have high views but
                        low conversion. Consider adjusting pricing or product
                        descriptions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-none">
                    <TrophyIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Customer Satisfaction
                      </h4>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        Your average rating of 4.7/5 is excellent! Maintain
                        quality standards to keep customers happy.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-none">
                    <TagIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                        Inventory Alert
                      </h4>
                      <p className="text-xs text-purple-700 dark:text-purple-400">
                        Smart Watch Pro is running low on stock (8 units).
                        Consider restocking soon to avoid stockouts.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none mt-6">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                  Goals & Targets
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Track your progress toward monthly and quarterly goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Monthly Revenue Goal
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(metrics.revenue.value)} /{" "}
                        {formatCurrency(30000)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-none h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-none transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (metrics.revenue.value / 30000) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {((metrics.revenue.value / 30000) * 100).toFixed(1)}%
                      completed
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Customer Acquisition
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {metrics.customers.value} / 200
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-none h-2">
                      <div
                        className="bg-green-500 h-2 rounded-none transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (metrics.customers.value / 200) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {((metrics.customers.value / 200) * 100).toFixed(1)}%
                      completed
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Order Volume
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {metrics.orders.value} / 300
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-none h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-none transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (metrics.orders.value / 300) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {((metrics.orders.value / 300) * 100).toFixed(1)}%
                      completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions */}
      <Card
        className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
      >
        <CardHeader>
          <CardTitle
            className={`text-base flex items-center gap-3 ${colors.texts.primary}`}
          >
            <div className="h-8 w-8 flex items-center justify-center rounded-none">
              <BoltIcon className={`h-4 w-4 ${colors.icons.primary}`} />
            </div>
            Quick Actions
          </CardTitle>
          <CardDescription className={`text-sm ${colors.texts.secondary}`}>
            Common actions based on your analytics insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <button
              className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none`}
            >
              <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-none">
                <CubeIcon className={`h-6 w-6 ${colors.texts.primary}`} />
              </div>
              <div className="text-center">
                <p className={`font-semibold ${colors.texts.primary} text-xs`}>
                  Add Product
                </p>
                <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                  Expand inventory
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
                <p className={`font-semibold ${colors.texts.primary} text-xs`}>
                  View Customers
                </p>
                <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                  Manage relationships
                </p>
              </div>
            </button>
            <button
              className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none`}
            >
              <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-none">
                <ShoppingCartIcon
                  className={`h-6 w-6 ${colors.texts.primary}`}
                />
              </div>
              <div className="text-center">
                <p className={`font-semibold ${colors.texts.primary} text-xs`}>
                  Check Orders
                </p>
                <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                  Process pending
                </p>
              </div>
            </button>
            <button
              className={`h-32 flex flex-col gap-3 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none`}
            >
              <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-none">
                <ArrowDownTrayIcon
                  className={`h-6 w-6 ${colors.texts.primary}`}
                />
              </div>
              <div className="text-center">
                <p className={`font-semibold ${colors.texts.primary} text-xs`}>
                  Export Report
                </p>
                <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                  Download data
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
