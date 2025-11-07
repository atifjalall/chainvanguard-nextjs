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
} from "@/components/_ui/card";
import { Button } from "@/components/_ui/button";
import { Badge } from "@/components/_ui/badge";
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Eye,
  Plus,
  Activity,
  Box,
  Loader2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { productAPI } from "@/lib/api/product.api";
import { toast } from "sonner";
import type { Product } from "@/types";

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
}

export default function VendorDashboardPage() {
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
        id: p.id || p._id, // Ensure id is always present
      }));

      const normalizedLowStockProducts = lowStockProds.map((p: any) => ({
        ...p,
        id: p.id || p._id, // Ensure id is always present
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      subtitle: `${stats?.activeProducts || 0} Active`,
      icon: Package,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue?.toFixed(2) || "0.00"}`,
      subtitle: "+12% from last month",
      icon: DollarSign,
      iconColor: "text-green-600",
      iconBg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Total Sales",
      value: stats?.totalSales || 0,
      subtitle: "+8% from last week",
      icon: ShoppingCart,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Total Views",
      value: stats?.totalViews?.toLocaleString() || 0,
      subtitle: "+15% engagement",
      icon: Eye,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  const quickActions = [
    {
      label: "Add Product",
      sublabel: "Create new listing",
      icon: Plus,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      route: "/vendor/add-product",
    },
    {
      label: "My Products",
      sublabel: "View inventory",
      icon: Package,
      iconColor: "text-green-600",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      route: "/vendor/my-products",
    },
    {
      label: "Orders",
      sublabel: "Manage orders",
      icon: ShoppingCart,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      route: "/vendor/orders",
    },
    {
      label: "Insights",
      sublabel: "View analytics",
      icon: TrendingUp,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      route: "/vendor/insights",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

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
                <Badge className="bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-sm backdrop-blur-sm text-xs">
                  {stats?.totalProducts || 0} Products
                </Badge>
                <Badge className="bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm backdrop-blur-sm text-xs">
                  {stats?.activeProducts || 0} Active
                </Badge>
              </div>
            </div>
            <button
              onClick={() => router.push("/vendor/add-product")}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors cursor-pointer shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
              Add New Product
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, index) => {
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

        {/* Quick Actions */}
        <div
          className={`transform transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                </div>
                Quick Actions
              </CardTitle>
              <CardDescription className="text-xs">
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
                      className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 hover:shadow-xl cursor-pointer group"
                    >
                      <div
                        className={`h-12 w-12 rounded-full ${action.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className={`h-6 w-6 ${action.iconColor}`} />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                          {action.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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

        {/* Content Grid */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory Overview */}
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Box className="h-4 w-4 text-purple-600" />
                  </div>
                  Inventory Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50/80 dark:bg-green-950/30 backdrop-blur-sm rounded-lg border border-green-100/50 dark:border-green-900/30 hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      In Stock
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {stats?.activeProducts || 0}
                    </p>
                  </div>
                  <Badge className="bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-sm backdrop-blur-sm text-xs">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-50/80 dark:bg-amber-950/30 backdrop-blur-sm rounded-lg border border-amber-100/50 dark:border-amber-900/30 hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Low Stock
                    </p>
                    <p className="text-lg font-bold text-amber-600">
                      {stats?.lowStock || 0}
                    </p>
                  </div>
                  <Badge className="bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shadow-sm backdrop-blur-sm text-xs">
                    Warning
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm rounded-lg border border-red-100/50 dark:border-red-900/30 hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Out of Stock
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      {stats?.outOfStock || 0}
                    </p>
                  </div>
                  <Badge className="bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400 shadow-sm backdrop-blur-sm text-xs">
                    Critical
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Products */}
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl lg:col-span-2 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    Recent Products
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/vendor/my-products")}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-xs"
                  >
                    View All
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  Your latest product listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50/80 dark:bg-blue-950/30 backdrop-blur-sm mb-4">
                      <Package className="h-8 w-8 text-blue-400" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                      No products yet. Add your first product!
                    </p>
                    <button
                      onClick={() => router.push("/vendor/add-product")}
                      className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-xs text-white font-medium transition-colors cursor-pointer mx-auto shadow-lg hover:shadow-xl"
                    >
                      <Plus className="h-3 w-3" />
                      Add Product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all cursor-pointer border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md"
                        onClick={() =>
                          router.push(`/vendor/my-products/${product._id}`)
                        }
                        style={{
                          minHeight: "90px",
                          alignItems: "center",
                        }}
                      >
                        {product.images?.[0]?.url ? (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200/80 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                product.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                product.status === "active"
                                  ? "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400 backdrop-blur-sm text-xs"
                                  : "text-xs"
                              }
                            >
                              {product.status}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {product.sku}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                            ${product.price}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
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
          <div
            className={`transform transition-all duration-700 delay-500 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center animate-pulse">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-amber-600 dark:text-amber-400">
                    Low Stock Alert
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  These products are running low on stock. Restock soon to avoid
                  out-of-stock situations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-4 bg-amber-50/80 dark:bg-amber-950/30 backdrop-blur-sm rounded-lg border border-amber-200/50 dark:border-amber-900/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {product.images?.[0]?.url ? (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200/80 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-xs">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-semibold text-amber-600 text-xs">
                              {product.quantity} left
                            </p>
                            <span className="text-xs text-gray-500">
                              Min: {product.minStockLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/vendor/my-products/${product._id}/edit`)
                        }
                        className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-xs text-white font-medium transition-colors cursor-pointer shadow-md hover:shadow-lg"
                      >
                        Restock
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
