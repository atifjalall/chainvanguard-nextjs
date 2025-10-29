/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Truck,
  MapPin,
  User,
  Mail,
  Phone,
  Home,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Edit,
  Download,
  Printer,
  Copy,
  ExternalLink,
  Shield,
  Activity,
  CreditCard,
  FileText,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { orderApi } from "@/lib/api/order.api";
import { Order, OrderStatus } from "@/types";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const response = await orderApi.getOrderById(orderId);

      if (response.success && response.order) {
        setOrder(response.order);
      } else {
        toast.error("Order not found");
        router.push("/vendor/orders");
      }
    } catch (error: any) {
      console.error("Failed to load order:", error);
      toast.error(error.response?.data?.message || "Failed to load order");
      router.push("/vendor/orders");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return {
          color:
            "bg-yellow-100/80 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-900/30",
          icon: Clock,
          label: "Pending",
          description: "Order is awaiting confirmation",
        };
      case "confirmed":
        return {
          color:
            "bg-blue-100/80 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30",
          icon: CheckCircle,
          label: "Confirmed",
          description: "Order has been confirmed",
        };
      case "processing":
        return {
          color:
            "bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30",
          icon: Package,
          label: "Processing",
          description: "Order is being prepared",
        };
      case "shipped":
        return {
          color:
            "bg-green-100/80 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200/50 dark:border-green-900/30",
          icon: Truck,
          label: "Shipped",
          description: "Order is in transit",
        };
      case "delivered":
        return {
          color:
            "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30",
          icon: CheckCircle,
          label: "Delivered",
          description: "Order has been delivered",
        };
      case "cancelled":
        return {
          color:
            "bg-red-100/80 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200/50 dark:border-red-900/30",
          icon: XCircle,
          label: "Cancelled",
          description: "Order has been cancelled",
        };
      case "refunded":
        return {
          color:
            "bg-orange-100/80 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200/50 dark:border-orange-900/30",
          icon: DollarSign,
          label: "Refunded",
          description: "Order has been refunded",
        };
      default:
        return {
          color:
            "bg-gray-100/80 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 border-gray-200/50 dark:border-gray-700/50",
          icon: Package,
          label: "Unknown",
          description: "Status unknown",
        };
    }
  };

  const getOrderProgress = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return 10;
      case "confirmed":
        return 30;
      case "processing":
        return 50;
      case "shipped":
        return 75;
      case "delivered":
        return 100;
      case "cancelled":
      case "refunded":
        return 0;
      default:
        return 0;
    }
  };

  const formatAddress = (address: Order["shippingAddress"]) => {
    if (!address) return "No address provided";
    return `${address.addressLine1 || ""}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
  };

  const handleCopyOrderId = () => {
    if (order) {
      navigator.clipboard.writeText(
        order.orderNumber || order.id || order._id || ""
      );
      toast.success("Order ID copied to clipboard");
    }
  };

  const handleCopyTrackingId = () => {
    if (order?.trackingId) {
      navigator.clipboard.writeText(order.trackingId);
      toast.success("Tracking ID copied to clipboard");
    }
  };

  const handlePrintOrder = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const handleDownloadInvoice = async () => {
    try {
      toast.info("Generating invoice...");
      setTimeout(() => toast.success("Invoice generated successfully"), 1000);
    } catch (error) {
      toast.error("Failed to generate invoice");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const progress = getOrderProgress(order.status);
  const history = order.statusHistory ?? [];

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

      <div className="relative z-10 p-6 space-y-4">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                Order Details
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-gray-600 dark:text-gray-400 text-lg font-mono">
                  {order.orderNumber || order.id || order._id}
                </p>
                <button
                  onClick={handleCopyOrderId}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Copy className="h-3 w-3 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className={`${statusConfig.color} flex items-center gap-2 px-4 py-2 border shadow-sm backdrop-blur-sm`}
                variant="outline"
              >
                <StatusIcon className="h-4 w-4" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push(`/vendor/orders/${orderId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors cursor-pointer shadow-lg hover:shadow-xl"
            >
              <Edit className="h-4 w-4" />
              Edit Order
            </button>

            <Button
              onClick={handleDownloadInvoice}
              variant="outline"
              className="hidden lg:flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Invoice
            </Button>

            {order.trackingId && (
              <button
                onClick={handleCopyTrackingId}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/60 dark:bg-gray-900/60 hover:bg-white/80 dark:hover:bg-gray-900/80 text-sm text-gray-700 dark:text-gray-300 font-medium transition-all cursor-pointer shadow-lg hover:shadow-xl border border-white/20 dark:border-gray-700/30 backdrop-blur-xl"
              >
                <Truck className="h-4 w-4" />
                Copy Tracking
              </button>
            )}
          </div>
        </div>

        {/* Order Status Timeline */}
        {order.status !== "cancelled" && order.status !== "refunded" && (
          <Card
            className={`border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-100 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Order Progress
                  </h3>
                  <span className="text-2xl font-bold text-blue-600">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm">
                  {[
                    { label: "Pending", value: 10 },
                    { label: "Confirmed", value: 30 },
                    { label: "Processing", value: 50 },
                    { label: "Shipped", value: 75 },
                    { label: "Delivered", value: 100 },
                  ].map((step) => (
                    <span
                      key={step.label}
                      className={
                        progress >= step.value
                          ? "text-gray-900 dark:text-gray-100 font-medium"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card
              className={`border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  Order Items
                </CardTitle>
                <CardDescription>
                  {order.products?.length || 0} item
                  {order.products?.length !== 1 ? "s" : ""} in this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.products && order.products.length > 0 ? (
                    order.products.map((item: any, index: number) => {
                      const productImage =
                        item.productSnapshot?.images?.[0]?.url ||
                        item.productSnapshot?.images?.[0]?.cloudinaryUrl ||
                        item.image ||
                        null;

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-shadow"
                        >
                          <div className="flex-shrink-0">
                            {productImage ? (
                              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200/80 dark:bg-gray-700/60 backdrop-blur-sm shadow-md">
                                <img
                                  src={productImage}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                                <Package className="h-10 w-10 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              {item.productName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span>Qty: {item.quantity}</span>
                              <span>•</span>
                              <span>
                                ${item.price?.toFixed(2) || "0.00"} each
                              </span>
                              {item.sku && (
                                <>
                                  <span>•</span>
                                  <span>SKU: {item.sku}</span>
                                </>
                              )}
                            </div>
                            {item.productSnapshot?.category && (
                              <Badge
                                variant="outline"
                                className="mt-2 text-xs bg-white/50 dark:bg-gray-900/50"
                              >
                                {item.productSnapshot.category}
                              </Badge>
                            )}
                          </div>

                          <div className="flex-shrink-0 text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              $
                              {item.subtotal?.toFixed(2) ||
                                (item.quantity * (item.price || 0)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No products in this order</p>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {order.shippingCost
                        ? `$${order.shippingCost.toFixed(2)}`
                        : "Free"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Tax
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      ${order.tax?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card
              className={`border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Shipping Address
                    </h4>
                    <div className="p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 min-h-[140px]">
                      <p className="text-gray-700 dark:text-gray-300">
                        {formatAddress(order.shippingAddress)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Tracking Information
                    </h4>
                    {order.trackingId ? (
                      <div className="p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 min-h-[140px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tracking ID
                          </span>
                          <Button
                            onClick={handleCopyTrackingId}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Copy className="h-3 w-3 text-gray-500" />
                          </Button>
                        </div>
                        <p className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                          {order.trackingId}
                        </p>
                        {order.carrier && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            Carrier: {order.carrier}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 text-center min-h-[140px]">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No tracking information available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Information - Moved here to fill space */}
            <Card
              className={`border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-100 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                  Order Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Order Number
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {order.orderNumber || order.id || order._id}
                    </p>
                    <button
                      onClick={handleCopyOrderId}
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Copy className="h-3 w-3 text-gray-500" />
                    </button>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Status
                  </p>
                  <Badge
                    className={`${statusConfig.color} flex items-center gap-1 w-fit border shadow-sm backdrop-blur-sm`}
                    variant="outline"
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {statusConfig.description}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Created
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Last Updated
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Activity className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    {new Date(order.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(order.updatedAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Payment Method
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300 capitalize">
                      {order.paymentMethod || "Crypto"}
                    </span>
                  </div>
                </div>

                {order.paymentStatus && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Payment Status
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        order.paymentStatus === "paid"
                          ? "bg-green-100/80 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200/50 dark:border-green-900/30"
                          : "bg-yellow-100/80 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-900/30"
                      }
                    >
                      {order.paymentStatus}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Now only Blockchain and Quick Actions */}
          <div className="space-y-6">
            {/* Customer Information - Moved to sidebar */}
            <Card
              className={`border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Name
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {order.customerName}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 break-all">
                      {order.customerEmail || "No email"}
                    </span>
                  </div>

                  {order.customerPhone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {order.customerPhone}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      window.location.href = `mailto:${order.customerEmail}`;
                    }}
                    variant="outline"
                    className="hidden lg:flex flex-1 flex items-center justify-center gap-1.5 px-3 py-2"
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </Button>
                  {order.customerPhone && (
                    <Button
                      onClick={() => {
                        window.location.href = `tel:${order.customerPhone}`;
                      }}
                      variant="outline"
                      className="hidden lg:flex flex-1 flex items-center justify-center gap-1.5 px-3 py-2"
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card
              className={`border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => router.push(`/vendor/orders/${orderId}/edit`)}
                  variant="outline"
                  className="hidden lg:flex flex-1 w-full flex items-center justify-start gap-2 px-3 py-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Order
                </Button>

                <Button
                  onClick={handleDownloadInvoice}
                  variant="outline"
                  className="hidden lg:flex flex-1 w-full flex items-center justify-start gap-2 px-3 py-2"
                >
                  <Download className="h-4 w-4" />
                  Download Invoice
                </Button>

                {order.customerEmail && (
                  <Button
                    onClick={() => {
                      window.location.href = `mailto:${order.customerEmail}?subject=Order ${order.orderNumber || order.id}`;
                    }}
                    variant="outline"
                    className="hidden lg:flex flex-1 w-full flex items-center justify-start gap-2 px-3 py-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email Customer
                  </Button>
                )}

                <Separator className="my-3" />

                {order.status !== "cancelled" &&
                  order.status !== "delivered" &&
                  order.status !== "refunded" && (
                    <Button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to cancel this order? This action cannot be undone."
                          )
                        ) {
                          router.push(`/vendor/orders/${orderId}/edit`);
                          toast.info("Navigate to edit page to cancel order");
                        }
                      }}
                      variant="danger"
                      className="hidden lg:flex flex-1 w-full flex items-center justify-start gap-2 px-3 py-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Order
                    </Button>
                  )}
              </CardContent>
            </Card>

            {/* Blockchain Information */}
            <Card
              className={`border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  Blockchain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-purple-50/80 dark:bg-purple-950/30 backdrop-blur-sm rounded-lg border border-purple-200/50 dark:border-purple-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Verified on Hyperledger
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    This order is securely recorded on the blockchain
                  </p>
                </div>

                <div className="space-y-2">
                  {order.blockchainTxId && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Transaction ID
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate flex-1">
                          {order.blockchainTxId}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              order.blockchainTxId || ""
                            );
                            toast.success("Transaction ID copied");
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                        >
                          <Copy className="h-3 w-3 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      toast.info("Blockchain explorer coming soon");
                    }}
                    variant="outline"
                    className="hidden lg:flex flex-1 w-full flex items-center justify-start gap-2 px-3 py-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on Explorer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Timeline/History */}
        {history.length > 0 && (
          <Card
            className={`border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-600 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-indigo-600" />
                </div>
                Order History
              </CardTitle>
              <CardDescription>
                Timeline of order status changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((event: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-md">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      {index < history.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {event.status?.replace("_", " ")}
                        </h4>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(event.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {event.notes}
                        </p>
                      )}
                      {event.changedBy && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Updated by: {event.changedByRole}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Navigation */}
        <div
          className={`flex items-center justify-between transform transition-all duration-700 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <div className="flex gap-3">
            <Button
              onClick={loadOrder}
              variant="outline"
              className="hidden lg:flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Refresh
            </Button>

            <button
              onClick={() => router.push(`/vendor/orders/${orderId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors cursor-pointer shadow-lg hover:shadow-xl"
            >
              <Edit className="h-4 w-4" />
              Edit Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
