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
  CubeIcon,
  BuildingOffice2Icon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  TagIcon,
  ClockIcon,
  TrophyIcon,
  BoltIcon,
  ChartBarIcon,
  ChartPieIcon,
  BuildingLibraryIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  PlusIcon,
  ClipboardDocumentCheckIcon,
  FaceSmileIcon,
  CheckBadgeIcon,
  AdjustmentsHorizontalIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import SupplierInsightsSkeleton from "@/components/skeletons/supplierInsightsSkeleton";
import { badgeColors, colors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

// Supplier analytics data interfaces
interface SupplyData {
  date: string;
  revenue: number;
  orders: number;
  vendors: number;
  avgOrderValue: number;
  inventoryValue: number;
}

interface ProductSupplyPerformance {
  id: string;
  name: string;
  category: string;
  revenue: number;
  orders: number;
  totalSupplied: number;
  avgOrderSize: number;
  stock: number;
}

interface VendorData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

// Mock supplier analytics data
const mockSupplyData: SupplyData[] = [
  {
    date: "2025-08-01",
    revenue: 15250,
    orders: 12,
    vendors: 8,
    avgOrderValue: 1270.83,
    inventoryValue: 125000,
  },
  {
    date: "2025-08-02",
    revenue: 18900,
    orders: 15,
    vendors: 10,
    avgOrderValue: 1260.0,
    inventoryValue: 127000,
  },
  {
    date: "2025-08-03",
    revenue: 22400,
    orders: 18,
    vendors: 12,
    avgOrderValue: 1244.44,
    inventoryValue: 124000,
  },
  {
    date: "2025-08-04",
    revenue: 16800,
    orders: 14,
    vendors: 9,
    avgOrderValue: 1200.0,
    inventoryValue: 123000,
  },
  {
    date: "2025-08-05",
    revenue: 28750,
    orders: 23,
    vendors: 15,
    avgOrderValue: 1250.0,
    inventoryValue: 128000,
  },
  {
    date: "2025-08-06",
    revenue: 21400,
    orders: 17,
    vendors: 11,
    avgOrderValue: 1258.82,
    inventoryValue: 126000,
  },
  {
    date: "2025-08-07",
    revenue: 25600,
    orders: 20,
    vendors: 13,
    avgOrderValue: 1280.0,
    inventoryValue: 129000,
  },
  {
    date: "2025-08-08",
    revenue: 31200,
    orders: 25,
    vendors: 16,
    avgOrderValue: 1248.0,
    inventoryValue: 131000,
  },
  {
    date: "2025-08-09",
    revenue: 19600,
    orders: 16,
    vendors: 10,
    avgOrderValue: 1225.0,
    inventoryValue: 130000,
  },
  {
    date: "2025-08-10",
    revenue: 27300,
    orders: 21,
    vendors: 14,
    avgOrderValue: 1300.0,
    inventoryValue: 132000,
  },
  {
    date: "2025-08-11",
    revenue: 34500,
    orders: 27,
    vendors: 18,
    avgOrderValue: 1277.78,
    inventoryValue: 133000,
  },
  {
    date: "2025-08-12",
    revenue: 23800,
    orders: 19,
    vendors: 12,
    avgOrderValue: 1252.63,
    inventoryValue: 131000,
  },
  {
    date: "2025-08-13",
    revenue: 29400,
    orders: 23,
    vendors: 15,
    avgOrderValue: 1278.26,
    inventoryValue: 134000,
  },
  {
    date: "2025-08-14",
    revenue: 36700,
    orders: 29,
    vendors: 19,
    avgOrderValue: 1265.52,
    inventoryValue: 136000,
  },
  {
    date: "2025-08-15",
    revenue: 32100,
    orders: 25,
    vendors: 16,
    avgOrderValue: 1284.0,
    inventoryValue: 135000,
  },
  {
    date: "2025-08-16",
    revenue: 28900,
    orders: 22,
    vendors: 14,
    avgOrderValue: 1313.64,
    inventoryValue: 137000,
  },
];

const mockProductSupplyPerformance: ProductSupplyPerformance[] = [
  {
    id: "1",
    name: "Industrial Steel Rods",
    category: "Raw Materials",
    revenue: 89500,
    orders: 45,
    totalSupplied: 2250,
    avgOrderSize: 50,
    stock: 500,
  },
  {
    id: "2",
    name: "Organic Cotton Fabric",
    category: "Textiles & Fabrics",
    revenue: 62000,
    orders: 38,
    totalSupplied: 4960,
    avgOrderSize: 130,
    stock: 2000,
  },
  {
    id: "3",
    name: "Electronic Circuit Boards",
    category: "Electronics Components",
    revenue: 71500,
    orders: 28,
    totalSupplied: 795,
    avgOrderSize: 28,
    stock: 150,
  },
  {
    id: "4",
    name: "Chemical Catalysts",
    category: "Chemical Products",
    revenue: 45200,
    orders: 22,
    totalSupplied: 550,
    avgOrderSize: 25,
    stock: 120,
  },
  {
    id: "5",
    name: "Precision Machine Parts",
    category: "Machinery & Equipment",
    revenue: 53800,
    orders: 19,
    totalSupplied: 285,
    avgOrderSize: 15,
    stock: 85,
  },
];

const mockVendorData: VendorData[] = [
  {
    name: "TechVendor Pro",
    value: 125000,
    percentage: 32.1,
    color: "#3B82F6",
    orders: 85,
  },
  {
    name: "Fashion Hub",
    value: 98000,
    percentage: 25.2,
    color: "#10B981",
    orders: 62,
  },
  {
    name: "Industrial Solutions",
    value: 87000,
    percentage: 22.4,
    color: "#F59E0B",
    orders: 54,
  },
  {
    name: "Manufacturing Corp",
    value: 79000,
    percentage: 20.3,
    color: "#EF4444",
    orders: 48,
  },
];

const mockCategoryData: CategoryData[] = [
  { name: "Raw Materials", value: 158000, percentage: 42.5, color: "#3B82F6" },
  {
    name: "Electronics Components",
    value: 89000,
    percentage: 23.9,
    color: "#10B981",
  },
  {
    name: "Textiles & Fabrics",
    value: 76000,
    percentage: 20.4,
    color: "#F59E0B",
  },
  {
    name: "Chemical Products",
    value: 49000,
    percentage: 13.2,
    color: "#EF4444",
  },
];

const timeRangeOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 3 Months" },
  { value: "1y", label: "Last Year" },
];

export default function SupplierAnalyticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState<
    "revenue" | "orders" | "vendors"
  >("revenue");
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState("supply");
  const [searchTerm, setSearchTerm] = useState("");

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      toast.error("Failed to load supplier analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const currentPeriodData = useMemo(() => {
    const totalRevenue = mockSupplyData.reduce(
      (sum, day) => sum + day.revenue,
      0
    );
    const totalOrders = mockSupplyData.reduce(
      (sum, day) => sum + day.orders,
      0
    );
    const totalVendors =
      mockSupplyData.reduce((sum, day) => sum + day.vendors, 0) /
      mockSupplyData.length;
    const avgOrderValue = totalRevenue / totalOrders;
    const avgInventoryValue =
      mockSupplyData.reduce((sum, day) => sum + day.inventoryValue, 0) /
      mockSupplyData.length;

    const revenueGrowth = 18.7;
    const ordersGrowth = 14.2;
    const vendorsGrowth = 22.1;
    const aovGrowth = 5.3;
    const inventoryGrowth = 8.9;

    return {
      revenue: { value: totalRevenue, growth: revenueGrowth },
      orders: { value: totalOrders, growth: ordersGrowth },
      vendors: { value: Math.round(totalVendors), growth: vendorsGrowth },
      avgOrderValue: { value: avgOrderValue, growth: aovGrowth },
      inventoryValue: { value: avgInventoryValue, growth: inventoryGrowth },
    };
  }, [timeRange]);

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

  if (isLoading) {
    return <SupplierInsightsSkeleton />;
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
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
              Supply Chain Analytics
            </h1>
            <p className={`text-base ${colors.texts.secondary} mt-2`}>
              Track your supply performance and vendor relationships
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
                className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
              >
                <ShieldCheckIcon
                  className={`h-3 w-3 mr-1 ${badgeColors.green.icon}`}
                />
                Blockchain Secured
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              title: "Total Revenue",
              value: currentPeriodData.revenue.value,
              growth: currentPeriodData.revenue.growth,
              icon: RsIcon,
              formatter: formatCurrency,
            },
            {
              title: "Supply Orders",
              value: currentPeriodData.orders.value,
              growth: currentPeriodData.orders.growth,
              icon: TruckIcon,
            },
            {
              title: "Active Vendors",
              value: currentPeriodData.vendors.value,
              growth: currentPeriodData.vendors.growth,
              icon: UsersIcon,
            },
            {
              title: "Avg Order Value",
              value: currentPeriodData.avgOrderValue.value,
              growth: currentPeriodData.avgOrderValue.growth,
              icon: TagIcon,
              formatter: formatCurrency,
            },
            {
              title: "Inventory Value",
              value: currentPeriodData.inventoryValue.value,
              growth: currentPeriodData.inventoryValue.growth,
              icon: BuildingStorefrontIcon,
              formatter: formatCurrency,
            },
          ].map((stat, index) => (
            <MetricCard
              key={index}
              title={stat.title}
              value={stat.value}
              growth={stat.growth}
              icon={stat.icon}
              formatter={stat.formatter}
              gradient={""}
              bgGradient={""}
            />
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div
        className={`transform transition-all duration-700 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Tabs defaultValue="supply">
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
              onClick={() => setSelectedTab("supply")}
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
              onClick={() => setSelectedTab("products")}
            >
              <CubeIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Products
            </TabsTrigger>
            <TabsTrigger
              value="vendors"
              className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${
                selectedTab === "vendors"
                  ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                  : `${colors.texts.secondary} hover:${colors.texts.primary}`
              } flex items-center gap-2 justify-center`}
              onClick={() => setSelectedTab("vendors")}
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
              onClick={() => setSelectedTab("performance")}
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
                    <AreaChart data={mockSupplyData}>
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
                    <LineChart data={mockSupplyData}>
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
                        name="Inventory Value (Rs)"
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
                  <BarChart data={mockSupplyData}>
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
                  Top Supply Products
                </CardTitle>
                <CardDescription
                  className={`text-sm ${colors.texts.secondary}`}
                >
                  Supply products ranked by revenue and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProductSupplyPerformance.map((product, index) => (
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
                      <div className="grid grid-cols-5 gap-6 text-right">
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
                            {product.totalSupplied}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Total Supplied
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {product.avgOrderSize}
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
                            Current Stock
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockCategoryData} layout="horizontal">
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
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={mockVendorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {mockVendorData.map((entry, index) => (
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
                  <div className="space-y-4">
                    {mockVendorData.map((vendor, index) => (
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
                              {vendor.orders} orders • {vendor.percentage}%
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className={`${colors.cards.base} rounded-none`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Order Fulfillment
                  </CardTitle>
                  <ClipboardDocumentCheckIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-foreground">98.5%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">
                      +1.2%
                    </span>{" "}
                    vs last period
                  </p>
                </CardContent>
              </Card>

              <Card className={`${colors.cards.base} rounded-none`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Vendor Satisfaction
                  </CardTitle>
                  <FaceSmileIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-foreground">4.8</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">
                      +0.2
                    </span>{" "}
                    vs last period
                  </p>
                </CardContent>
              </Card>

              <Card className={`${colors.cards.base} rounded-none`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Lead Time
                  </CardTitle>
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-foreground">3.2d</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">
                      -0.5d
                    </span>{" "}
                    vs last period
                  </p>
                </CardContent>
              </Card>

              <Card className={`${colors.cards.base} rounded-none`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Quality Score
                  </CardTitle>
                  <CheckBadgeIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-foreground">96.8%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">
                      +0.8%
                    </span>{" "}
                    vs last period
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className={`${colors.cards.base} rounded-none mt-6`}>
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
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-none">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                        Excellent Supply Performance
                      </h4>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        Your supply revenue increased by 18.7% this month. Raw
                        Materials category is driving growth with strong vendor
                        demand.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-none">
                    <GlobeAltIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Expansion Opportunity
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        TechVendor Pro accounts for 32% of your revenue.
                        Consider diversifying your vendor base or expanding
                        capacity for this high-value relationship.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-none">
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Inventory Optimization
                      </h4>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        Electronic Circuit Boards have low stock (150 units) but
                        high demand. Consider increasing inventory levels to
                        avoid stockouts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-none">
                    <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Vendor Relationships
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        Vendor satisfaction score of 4.8/5 is excellent.
                        Continue providing quality products and reliable
                        delivery to maintain strong partnerships.
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
                        {formatCurrency(currentPeriodData.revenue.value)} /{" "}
                        {formatCurrency(750000)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((currentPeriodData.revenue.value / 750000) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(
                        (currentPeriodData.revenue.value / 750000) *
                        100
                      ).toFixed(1)}
                      % completed
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Vendor Partnerships
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {currentPeriodData.vendors.value} / 25
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((currentPeriodData.vendors.value / 25) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((currentPeriodData.vendors.value / 25) * 100).toFixed(
                        1
                      )}
                      % completed
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Supply Orders
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {currentPeriodData.orders.value} / 500
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((currentPeriodData.orders.value / 500) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((currentPeriodData.orders.value / 500) * 100).toFixed(
                        1
                      )}
                      % completed
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
                <p className={`font-semibold ${colors.texts.primary} text-xs`}>
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
                <p className={`font-semibold ${colors.texts.primary} text-xs`}>
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
                <p className={`font-semibold ${colors.texts.primary} text-xs`}>
                  Check Inventory
                </p>
                <p className={`text-xs ${colors.texts.muted} mt-0.5`}>
                  Stock levels
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
                  Supply chain data
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
