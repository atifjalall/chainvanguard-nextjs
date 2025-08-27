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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Star,
  DollarSign,
  Eye,
  Plus,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Heart,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import Link from "next/link";

// Mock data - replace with Hyperledger Fabric calls
const mockCartItems = [
  {
    id: "cart-001",
    name: "Organic Coffee Beans",
    vendor: "Green Farm Co.",
    price: 24.99,
    quantity: 2,
    image: "/api/placeholder/80/80",
    inStock: true,
  },
  {
    id: "cart-002",
    name: "Premium Tea Collection",
    vendor: "Mountain Tea Ltd.",
    price: 89.99,
    quantity: 1,
    image: "/api/placeholder/80/80",
    inStock: true,
  },
];

const mockOrders = [
  {
    id: "ORD-001",
    date: "2025-08-12",
    total: 156.78,
    status: "delivered",
    items: 3,
    vendor: "Green Farm Co.",
    trackingId: "TRK001",
    estimatedDelivery: "2025-08-14",
  },
  {
    id: "ORD-002",
    date: "2025-08-10",
    total: 89.99,
    status: "shipped",
    items: 1,
    vendor: "Mountain Tea Ltd.",
    trackingId: "TRK002",
    estimatedDelivery: "2025-08-16",
  },
  {
    id: "ORD-003",
    date: "2025-08-08",
    total: 245.5,
    status: "processing",
    items: 5,
    vendor: "Tech Solutions Inc.",
    trackingId: "TRK003",
    estimatedDelivery: "2025-08-18",
  },
];

const mockLastOrder = {
  id: "ORD-002",
  status: "shipped",
  estimatedDelivery: "2025-08-16",
  currentLocation: "Distribution Center - Frankfurt",
  progress: 75,
  trackingSteps: [
    { step: "Order Confirmed", completed: true, date: "2025-08-10" },
    { step: "Processing", completed: true, date: "2025-08-10" },
    { step: "Shipped", completed: true, date: "2025-08-12" },
    { step: "In Transit", completed: true, date: "2025-08-13" },
    { step: "Out for Delivery", completed: false, date: "2025-08-16" },
    { step: "Delivered", completed: false, date: "2025-08-16" },
  ],
};

const mockRecentProducts = [
  {
    id: "prod-001",
    name: "Wireless Bluetooth Headphones",
    vendor: "Tech Solutions Inc.",
    price: 199.99,
    rating: 4.8,
    image: "/api/placeholder/120/120",
    category: "Electronics",
  },
  {
    id: "prod-002",
    name: "Organic Cotton T-Shirt",
    vendor: "Eco Fashion",
    price: 29.99,
    rating: 4.6,
    image: "/api/placeholder/120/120",
    category: "Clothing",
  },
  {
    id: "prod-003",
    name: "Natural Honey",
    vendor: "Local Farms",
    price: 18.5,
    rating: 4.9,
    image: "/api/placeholder/120/120",
    category: "Food",
  },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState(mockCartItems);
  const [recentOrders, setRecentOrders] = useState(mockOrders);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Calculate stats
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalSpent = recentOrders.reduce((sum, order) => sum + order.total, 0);
  const ordersInTransit = recentOrders.filter(
    (order) => order.status === "shipped" || order.status === "processing"
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400";
      case "shipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400";
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
    toast.success("Item removed from cart");
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return "U";
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                <AvatarImage
                  src="/default-avatar.png"
                  alt={user?.name ?? "User"}
                />{" "}
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-2">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Welcome back, {user?.name || "Customer"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
                Your blockchain supply chain dashboard
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Verified Customer
                </Badge>
                <Badge variant="outline" className="border-gray-300">
                  <Shield className="h-3 w-3 mr-1" />
                  Secure Wallet
                </Badge>
              </div>
            </div>
          </div>
          <Link href="/customer/browse">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Browse Products
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`transform transition-all duration-700 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Cart Items",
              value: cartItemCount,
              subtitle: `${cartTotal.toFixed(2)} total value`,
              icon: ShoppingCart,
            },
            {
              title: "Total Orders",
              value: recentOrders.length,
              subtitle: "Orders placed",
              icon: Package,
            },
            {
              title: "In Transit",
              value: ordersInTransit,
              subtitle: "Orders shipping",
              icon: Truck,
            },
            {
              title: "Total Spent",
              value: `${totalSpent.toFixed(2)}`,
              subtitle: "All time purchases",
              icon: DollarSign,
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div
        className={`transform transition-all duration-700 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                Recent Orders
              </CardTitle>
              <CardDescription>
                Track your latest blockchain transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {recentOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="group flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {order.id}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.vendor} • {order.items} items
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <Badge
                        className={`${getStatusColor(order.status)} text-xs`}
                        variant="secondary"
                      >
                        {order.status}
                      </Badge>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Link href="/customer/orders">
                <Button
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  View All Orders
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                Shopping Cart ({cartItemCount} items)
              </CardTitle>
              <CardDescription>
                Items ready for blockchain checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {cartItems.length > 0 ? (
                <>
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.vendor}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity} × ${item.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Total:
                      </span>
                      <span className="font-bold text-xl text-gray-900 dark:text-gray-100">
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                    <Link href="/customer/cart">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <Shield className="h-4 w-4 mr-2" />
                        Proceed to Checkout
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your cart is empty
                  </p>
                  <Link href="/customer/browse">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Tracking Section */}
      <div
        className={`transform transition-all duration-700 delay-600 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              Latest Order Tracking
            </CardTitle>
            <CardDescription>
              Real-time blockchain supply chain tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Order {mockLastOrder.id}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current Status: {mockLastOrder.currentLocation}
                  </p>
                </div>
                <Badge
                  className={getStatusColor(mockLastOrder.status)}
                  variant="secondary"
                >
                  {mockLastOrder.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Delivery Progress
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {mockLastOrder.progress}%
                  </span>
                </div>
                <Progress
                  value={mockLastOrder.progress}
                  className="h-3 bg-gray-200 dark:bg-gray-700"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estimated delivery: {mockLastOrder.estimatedDelivery}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
                {mockLastOrder.trackingSteps.map((step, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center"
                  >
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300 ${
                        step.completed
                          ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-950 dark:border-green-400 dark:text-green-400"
                          : "bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {step.step}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {step.date}
                    </p>
                  </div>
                ))}
              </div>

              <Link href="/customer/orders">
                <Button
                  variant="outline"
                  className="w-full mt-6 border-gray-200 dark:border-gray-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  View Full Tracking Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
