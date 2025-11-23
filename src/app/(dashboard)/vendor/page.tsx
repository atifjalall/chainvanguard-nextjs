/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
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
import {
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ExclamationCircleIcon,
  EyeIcon,
  PlusIcon,
  Squares2X2Icon,
  ArrowUpRightIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { productAPI } from "@/lib/api/product.api";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/use-page-title";
import type { Product } from "@/types";
import { Loader2 } from "lucide-react";
import { badgeColors, colors } from "@/lib/colorConstants";

// Currency formatting (CVT, abbreviated)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "CVT",
    maximumFractionDigits: 0,
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

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  averagePrice: number;
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  totalOrders?: number;
}

export default function VendorDashboardPage() {
  usePageTitle("Vendor Dashboard");
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const statsResponse = await productAPI.getProductStats();
      const productsResponse = await productAPI.getVendorProducts({
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const lowStockResponse = await productAPI.getLowStockProducts();

      const products = productsResponse?.data || [];
      const lowStockProds = lowStockResponse?.products || [];

      // ✅ Normalize products to ensure id field exists and is a string
      const normalizedProducts = products.map((p: any) => ({
        ...p,
        id: p.id || p._id,
      }));

      const normalizedLowStockProducts = lowStockProds.map((p: any) => ({
        ...p,
        id: p.id || p._id,
      }));

      const totalViews = normalizedProducts.reduce(
        (sum, p) => sum + (p.views || 0),
        0
      );
      const totalSales = normalizedProducts.reduce(
        (sum, p) => sum + (p.totalSold || 0),
        0
      );
      const totalRevenue = normalizedProducts.reduce(
        (sum, p) => sum + (p.totalSold || 0) * (p.price || 0),
        0
      );

      setStats({
        ...(statsResponse?.stats || {}),
        totalProducts: statsResponse?.stats?.totalProducts || 0,
        activeProducts: statsResponse?.stats?.activeProducts || 0,
        outOfStock: statsResponse?.stats?.outOfStock || 0,
        lowStock: statsResponse?.stats?.lowStock || 0,
        totalValue: statsResponse?.stats?.totalValue || 0,
        averagePrice: statsResponse?.stats?.averagePrice || 0,
        totalViews,
        totalSales,
        totalRevenue,
        totalOrders: 0,
      });

      setRecentProducts(normalizedProducts);
      setLowStockProducts(normalizedLowStockProducts);
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      toast.error(error.message || "Failed to load dashboard data");

      setStats({
        totalProducts: 0,
        activeProducts: 0,
        outOfStock: 0,
        lowStock: 0,
        totalValue: 0,
        averagePrice: 0,
        totalViews: 0,
        totalSales: 0,
        totalRevenue: 0,
      });
      setRecentProducts([]);
      setLowStockProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-900 dark:text-gray-100" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  type StatData = {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    badge?: React.ReactNode;
    trend?: {
      value: number;
      isPositive: boolean;
      label: string;
    };
  };

  const statsData: StatData[] = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      subtitle: `${stats?.activeProducts || 0} Active`,
      icon: CubeIcon,
      badge: (
        <Badge
          className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
        >
          {stats?.activeProducts || 0} Active
        </Badge>
      ),
    },
    {
      title: "Total Revenue",
      value: formatCurrencyAbbreviated(stats?.totalRevenue || 0),
      subtitle: `${stats?.totalOrders || 0} orders`,
      icon: CurrencyDollarIcon,
      trend: { value: 12, isPositive: true, label: "from last month" },
    },
    {
      title: "Total Sales",
      value: stats?.totalSales || 0,
      subtitle: "Total items sold",
      icon: ShoppingCartIcon,
      trend: { value: 8, isPositive: true, label: "from last week" },
    },
    {
      title: "Total Views",
      value: stats?.totalViews?.toLocaleString() || 0,
      subtitle: "Product views",
      icon: EyeIcon,
      trend: { value: 15, isPositive: true, label: "engagement" },
    },
  ];

  const quickActions = [
    {
      label: "Add Product",
      sublabel: "Create new listing",
      icon: PlusIcon,
      route: "/vendor/add-product",
    },
    {
      label: "My Products",
      sublabel: "View inventory",
      icon: CubeIcon,
      route: "/vendor/my-products",
    },
    {
      label: "Orders",
      sublabel: "Manage orders",
      icon: ShoppingCartIcon,
      route: "/vendor/orders",
    },
    {
      label: "Insights",
      sublabel: "View analytics",
      icon: ArrowTrendingUpIcon,
      route: "/vendor/insights",
    },
  ];

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Vendor Dashboard
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name || "Vendor"}! 👋
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  {stats?.totalProducts || 0} Products
                </Badge>
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  {stats?.activeProducts || 0} Active
                </Badge>
              </div>
            </div>
            <Button
              onClick={() => router.push("/vendor/add-product")}
              className="flex items-center gap-2 px-4 py-2 rounded-none bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium text-xs cursor-pointer transition-all"
            >
              <PlusIcon className="h-4 w-4" />
              Add New Product
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <div
            className={`transform transition-all duration-700 delay-200 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsData.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={index}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02]"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </CardTitle>
                      <div className="h-10 w-10 flex items-center justify-center rounded-none">
                        <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {stat.value}
                      </div>
                      {stat.badge ? (
                        <div>{stat.badge}</div>
                      ) : stat.trend ? (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span
                            className={`inline-flex items-baseline gap-0.5 ${
                              stat.trend.isPositive
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            } font-medium`}
                          >
                            {stat.trend.isPositive ? (
                              <ArrowTrendingUpIcon className="h-3 w-3" />
                            ) : (
                              <ArrowTrendingDownIcon className="h-3 w-3" />
                            )}
                            {stat.trend.isPositive ? "+" : ""}
                            {stat.trend.value}%
                          </span>
                          <span className="ml-1 text-xs text-gray-600 dark:text-gray-400 font-normal">
                            {stat.trend.label}
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {stat.subtitle}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory Overview */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none !shadow-none hover:!shadow-none transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base text-gray-900 dark:text-gray-100">
                  <Squares2X2Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  Inventory Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      In Stock
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {stats?.activeProducts || 0}
                    </p>
                  </div>
                  <Badge
                    className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                  >
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Low Stock
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {stats?.lowStock || 0}
                    </p>
                  </div>
                  <Badge
                    className={`${badgeColors.yellow.bg} ${badgeColors.yellow.border} ${badgeColors.yellow.text} text-xs rounded-none`}
                  >
                    Warning
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Out of Stock
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {stats?.outOfStock || 0}
                    </p>
                  </div>
                  <Badge
                    className={`${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} text-xs rounded-none`}
                  >
                    Critical
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Products */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 lg:col-span-2 rounded-none !shadow-none hover:!shadow-none transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-base text-gray-900 dark:text-gray-100">
                    <CubeIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    Recent Products
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/vendor/my-products")}
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none text-xs border-0"
                  >
                    View All
                    <ArrowUpRightIcon className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                  Your latest product listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <CubeIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                      No products yet. Add your first product!
                    </p>
                    <Button
                      onClick={() => router.push("/vendor/add-product")}
                      className="flex items-center gap-2 px-4 py-2 rounded-none bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium text-xs cursor-pointer mx-auto"
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-none transition-all cursor-pointer"
                        onClick={() =>
                          router.push(`/vendor/my-products/${product._id}`)
                        }
                        style={{ minHeight: "90px", alignItems: "center" }}
                      >
                        {product.images?.[0]?.url ? (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-9 h-12 object-cover rounded-none"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-none flex items-center justify-center shadow-md">
                            <CubeIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={
                                product.status === "active"
                                  ? `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`
                                  : product.status === "inactive"
                                    ? `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} text-xs rounded-none`
                                    : "text-xs rounded-none"
                              }
                            >
                              {product.status}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              SKU: {product.sku}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                            {formatCurrency(product.price)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Stock: {product.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div>
            <div
              className={`transform transition-all duration-700 delay-500 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none !shadow-none hover:!shadow-none transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base text-gray-900 dark:text-gray-100">
                    <ExclamationCircleIcon className="h-5 w-5 text-gray-700 dark:text-gray-300 animate-pulse" />
                    <span>Low Stock Alert</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                    These products are running low on stock. Restock soon to
                    avoid out-of-stock situations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product._id}
                        className={`flex items-center justify-between p-4 ${badgeColors.yellow.bg} ${badgeColors.yellow.border} rounded-none hover:shadow-none transition-all`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {product.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-none shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-none flex items-center justify-center flex-shrink-0 shadow-md">
                              <CubeIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-xs">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                                {product.quantity} left
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                Min: {product.minStockLevel}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            router.push(
                              `/vendor/my-products/${product._id}/edit`
                            )
                          }
                          className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-none bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium text-xs cursor-pointer"
                        >
                          Restock
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none !shadow-none hover:!shadow-none transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base text-gray-900 dark:text-gray-100">
                <BoltIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                Manage your products and business efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => router.push(action.route)}
                      className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-300 cursor-pointer group rounded-none !shadow-none hover:!shadow-none"
                    >
                      <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-none">
                        <Icon className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                          {action.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {action.sublabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
