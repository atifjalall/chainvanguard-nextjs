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
import { analyticsApi } from "@/lib/api/supplier.dashboard.api";
import supplierRatingApi from "@/lib/api/supplier.rating.api";

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
  averageRating?: number;
  totalRatings?: number;
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

// Use the TopVendor type from your shared types to ensure compatibility
import type { TopVendor } from "@/types";
import { usePageTitle } from "@/hooks/use-page-title";

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
  image?: string; // Add image field
}

// Custom CVT Icon component
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

export default function SupplierDashboard() {
  usePageTitle("Supplier Dashboard");
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("month");
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInventory: 0,
    totalVendors: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    totalOrders: 0,
    activeInventory: 0,
    lowStockInventory: 0,
    outOfStockInventory: 0,
    pendingVendors: 0,
    completedTransactions: 0,
    totalInventoryValue: 0,
    avgOrderValue: 0,
    averageRating: 0,
    totalRatings: 0,
  });

  useEffect(() => {
    setIsVisible(true);
    loadDashboardData();
  }, [user?.id, selectedTimeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Fetching analytics from backend...");

      const analyticsData = await analyticsApi.getSupplierAnalytics(
        selectedTimeRange as "week" | "month" | "quarter" | "year"
      );

      console.log("📊 Analytics data received:", analyticsData);

      let vendorCount = 0;
      try {
        vendorCount = await analyticsApi.getVendorCount();
      } catch {
        vendorCount = 0;
      }

      if (analyticsData.success) {
        // Transform data to metrics
        const dashboardMetrics = analyticsApi.transformToMetrics(analyticsData);
        dashboardMetrics.totalVendors = vendorCount; // Set correct vendor count
        console.log("✅ Transformed metrics:", dashboardMetrics);
        setMetrics(dashboardMetrics);

        // Fetch supplier rating if user is supplier
        if (user?.id && user?.role === "supplier") {
          try {
            const ratingData = await analyticsApi.getSupplierRatingStats(
              user.id
            );
            dashboardMetrics.averageRating = ratingData.averageRating;
            dashboardMetrics.totalRatings = ratingData.totalRatings;
          } catch (error) {
            console.error("Failed to load rating stats:", error);
            dashboardMetrics.averageRating = 0;
            dashboardMetrics.totalRatings = 0;
          }
        }

        // Transform and set top vendors
        const transformedVendors = analyticsApi.transformTopVendors(
          analyticsData.analytics.topVendors
        );
        console.log("👥 Top vendors:", transformedVendors);
        setTopVendors(transformedVendors);

        // Fetch and map dynamic ratings for top vendors
        if (user?.id && user?.role === "supplier") {
          try {
            const ratingsResponse = await supplierRatingApi.getSupplierRatings(
              user.id
            );
            if (ratingsResponse.success) {
              const ratingMap = new Map();
              ratingsResponse.ratings.forEach((rating) => {
                ratingMap.set(rating.vendorId, rating.overallRating);
              });
              setTopVendors((prev) =>
                prev.map((vendor) => ({
                  ...vendor,
                  rating: ratingMap.get(vendor.id) || vendor.rating || 0,
                }))
              );
            }
          } catch (error) {
            console.error("Failed to fetch vendor ratings:", error);
          }
        }

        // Use real top products from analytics
        const topProductsData = analyticsApi.transformTopProducts(
          analyticsData.analytics.topProducts
        );
        setTopProducts(topProductsData);

        // Generate recent activity
        const activity = analyticsApi.generateRecentActivity(analyticsData);
        console.log("📝 Recent activity:", activity);
        setRecentActivity(activity);

        toast.success("Dashboard loaded successfully");
      }
    } catch (error: any) {
      console.error("❌ Failed to load analytics:", error);
      toast.error(error.message || "Failed to load dashboard data");

      // Set empty state on error
      setMetrics({
        totalInventory: 0,
        totalVendors: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        totalOrders: 0,
        activeInventory: 0,
        lowStockInventory: 0,
        outOfStockInventory: 0,
        pendingVendors: 0,
        completedTransactions: 0,
        totalInventoryValue: 0,
        avgOrderValue: 0,
        averageRating: 0,
        totalRatings: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      currency: "CVT",
    }).format(amount);
  };

  const formatCurrencyAbbreviated = (amount: number) => {
    if (amount >= 1e9) {
      return `${(amount / 1e9).toFixed(2)} B`;
    } else if (amount >= 1e6) {
      return `${(amount / 1e6).toFixed(2)} M`;
    } else {
      return formatCurrency(amount);
    }
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

  const vendorSatisfaction = useMemo(() => {
    if (topVendors.length === 0) return { rating: "0.0", percentage: 0 };

    const totalRating = topVendors.reduce(
      (sum, vendor) => sum + (vendor.rating || 0),
      0
    );
    const avgRating = totalRating / topVendors.length;
    const percentage = (avgRating / 5) * 100;

    return {
      rating: avgRating.toFixed(1),
      percentage: Math.round(percentage),
    };
  }, [topVendors]);

  // Calculate stock turnover rate
  const stockTurnover = useMemo(() => {
    if (metrics.totalInventoryValue === 0 || metrics.totalRevenue === 0) {
      return { rate: "0.0", percentage: 0, comparison: "Below" };
    }

    const turnoverRate = metrics.totalRevenue / metrics.totalInventoryValue;
    const industryAvg = 5;
    const percentage = Math.min((turnoverRate / industryAvg) * 100, 100);

    return {
      rate: turnoverRate.toFixed(1),
      percentage: Math.round(percentage),
      comparison: turnoverRate >= industryAvg ? "Above" : "Below",
    };
  }, [metrics.totalRevenue, metrics.totalInventoryValue]);

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
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  {metrics.totalInventory}{" "}
                  {metrics.totalInventory === 1
                    ? "Inventory Item"
                    : "Inventory Items"}
                </Badge>
                <Badge
                  className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                >
                  {metrics.totalVendors}{" "}
                  {metrics.totalVendors === 1 ? "Vendor" : "Vendors"}
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
            <Button
              onClick={() => router.push("/supplier/add-inventory")}
              className={`flex items-center gap-2 px-4 py-2 rounded-none ${colors.buttons.primary} font-medium text-xs cursor-pointer transition-all`}
            >
              <PlusIcon className={`h-4 w-4 ${colors.texts.inverse}`} />
              Add Inventory
            </Button>
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
                value: formatCurrencyAbbreviated(metrics.totalRevenue),
                subtitle: `${metrics.totalOrders} orders`,
                icon: RsIcon,
              },
              {
                title: "Active Vendors",
                value: metrics.totalVendors,
                subtitle: `${metrics.pendingVendors} pending`,
                icon: UsersIcon,
              },
              {
                title: "Total Inventory",
                value: metrics.totalInventory,
                subtitle: `${metrics.activeInventory} active`,
                icon: BuildingStorefrontIcon,
              },
              {
                title: "Inventory Value",
                value: formatCurrencyAbbreviated(metrics.totalInventoryValue),
                subtitle: "Current stock value",
                icon: CubeIcon,
              },
              {
                title: "Low Stock Items",
                value: metrics.lowStockInventory,
                subtitle: "Need reordering",
                icon: ExclamationTriangleIcon,
              },
              {
                title: "Avg Order Value",
                value: formatCurrencyAbbreviated(metrics.avgOrderValue),
                subtitle: "Per transaction",
                icon: TagIcon,
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
                    <p className={`text-xs ${colors.texts.secondary}`}>
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
                {recentActivity.length === 0 ? (
                  <div className="text-center py-12">
                    <ClockIcon
                      className={`h-12 w-12 mx-auto ${colors.icons.secondary} mb-3`}
                    />
                    <p className={`text-sm ${colors.texts.secondary}`}>
                      No recent activity
                    </p>
                    <p className={`text-xs ${colors.texts.muted} mt-1`}>
                      Your activity will appear here
                    </p>
                  </div>
                ) : (
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
                            <Icon
                              className={`h-5 w-5 ${colors.icons.primary}`}
                            />
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
                                    {formatCurrencyAbbreviated(activity.amount)}
                                  </Badge>
                                )}
                                <span
                                  className={`text-xs ${colors.texts.muted}`}
                                >
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
                              <p
                                className={`text-xs ${colors.texts.muted} mt-1`}
                              >
                                Customer: {activity.customer}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                      {formatCurrencyAbbreviated(metrics.totalRevenue)} /{" "}
                      {formatCurrencyAbbreviated(10000000)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      (metrics.totalRevenue / 10000000) * 100,
                      100
                    )}
                    className="h-2 rounded-none"
                  />
                  <p className={`text-xs ${colors.texts.muted} mt-1`}>
                    {Math.round(
                      Math.min((metrics.totalRevenue / 10000000) * 100, 100)
                    )}
                    % completed
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      Vendor Satisfaction
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {vendorSatisfaction.rating}/5
                    </span>
                  </div>
                  <Progress
                    value={vendorSatisfaction.percentage}
                    className="h-2 rounded-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {vendorSatisfaction.percentage}% satisfaction rate
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      Supplier Rating
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <StarIcon className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {metrics.averageRating || 0}/5
                    </span>
                  </div>
                  <Progress
                    value={(metrics.averageRating || 0) * 20}
                    className="h-2 rounded-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    From {metrics.totalRatings || 0} vendor
                    {metrics.totalRatings !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      Stock Turnover
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {stockTurnover.rate}x
                    </span>
                  </div>
                  <Progress
                    value={stockTurnover.percentage}
                    className="h-2 rounded-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {stockTurnover.comparison} industry average
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
                {topVendors.length === 0 ? (
                  <div className="text-center py-12">
                    <UsersIcon
                      className={`h-12 w-12 mx-auto ${colors.icons.secondary} mb-3`}
                    />
                    <p className={`text-sm ${colors.texts.secondary}`}>
                      No vendor data
                    </p>
                    <p className={`text-xs ${colors.texts.muted} mt-1`}>
                      Vendor activity will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topVendors.map((vendor) => {
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
                                      : `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} flex items-center gap-1 text-xs rounded-none`
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
                                  {formatCurrencyAbbreviated(vendor.totalSpent)}
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
                                <p className={`${colors.texts.muted}`}>
                                  Orders
                                </p>
                              </div>
                              <div>
                                <p
                                  className={`font-medium ${colors.texts.primary} text-xs`}
                                >
                                  {vendor.rating || 0}/5
                                </p>
                                <p className={`${colors.texts.muted}`}>
                                  Rating
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Items */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                >
                  <StarIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                  Top Items
                </CardTitle>
                <CardDescription
                  className={`text-xs ${colors.texts.secondary}`}
                >
                  Your best performing supply items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <CubeIcon
                      className={`h-12 w-12 mx-auto ${colors.icons.secondary} mb-3`}
                    />
                    <p className={`text-sm ${colors.texts.secondary}`}>
                      No inventory data
                    </p>
                    <p className={`text-xs ${colors.texts.muted} mt-1`}>
                      Item performance will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product) => {
                      const statusConfig = getStatusConfig(product.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <div
                          key={product.id}
                          className={`flex items-center gap-4 p-4 ${colors.backgrounds.tertiary} rounded-none ${colors.backgrounds.hover} transition-all cursor-pointer ${colors.borders.primary} hover:shadow-none`}
                        >
                          <div className="relative">
                            <Avatar
                              className={`h-12 w-12 ${colors.borders.primary} rounded-none ${colors.backgrounds.tertiary}`}
                            >
                              <AvatarImage
                                src={product.image}
                                alt={product.name}
                              />
                              <AvatarFallback
                                className={`${colors.texts.primary} font-bold rounded-none`}
                              >
                                {getInitials(product.name)}
                              </AvatarFallback>
                            </Avatar>
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
                                      : `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} flex items-center gap-1 text-xs rounded-none`
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
                                  {formatCurrencyAbbreviated(product.revenue)}
                                </p>
                                <p className={`${colors.texts.muted}`}>
                                  Revenue
                                </p>
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
                )}
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
                  onClick={() => router.push("/supplier/add-inventory")}
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
                  onClick={() => router.push("/supplier/vendors")}
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
                  onClick={() => router.push("/supplier/inventory")}
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
                  onClick={() => router.push("/supplier/insights")}
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
