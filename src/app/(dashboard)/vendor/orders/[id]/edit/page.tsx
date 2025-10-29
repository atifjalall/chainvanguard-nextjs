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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
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
  Loader2,
  Edit,
  X,
  Eye,
  RefreshCw,
  Clock,
  XCircle,
  Shield,
  Activity,
  CreditCard,
  FileText,
  Copy,
  ExternalLink,
  Building2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { orderApi } from "@/lib/api/order.api";
import { Order, OrderStatus } from "@/types";

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Form state
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [trackingId, setTrackingId] = useState("");
  const [carrier, setCarrier] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");

  // Shipping address editing
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  // Customer info editing
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Confirmation dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const getAllowedStatusTransitions = (
    currentStatus: OrderStatus
  ): OrderStatus[] => {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["pending", "confirmed", "cancelled"],
      confirmed: ["confirmed", "processing", "cancelled"],
      processing: ["processing", "shipped", "cancelled"],
      shipped: ["shipped", "delivered", "cancelled"],
      delivered: ["delivered", "refunded"],
      cancelled: ["cancelled"],
      refunded: ["refunded"],
    };

    return transitions[currentStatus] || [currentStatus];
  };

  useEffect(() => {
    setIsVisible(true);
    loadOrder();
  }, [orderId]);

  const canTransitionToStatus = (
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): boolean => {
    const allowedTransitions = getAllowedStatusTransitions(currentStatus);
    return allowedTransitions.includes(newStatus);
  };

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const response = await orderApi.getOrderById(orderId);

      if (response.success && response.order) {
        const orderData = response.order;
        setOrder(orderData);

        // Set form values
        setStatus(orderData.status);
        setTrackingId(orderData.trackingNumber || orderData.trackingId || "");
        setCarrier(orderData.courierName || orderData.carrier || "");
        setEstimatedDeliveryDate(orderData.estimatedDeliveryDate || "");

        // Set shipping address
        if (orderData.shippingAddress) {
          setShippingAddress({
            name: orderData.shippingAddress.name || "",
            addressLine1: orderData.shippingAddress.addressLine1 || "",
            addressLine2: orderData.shippingAddress.addressLine2 || "",
            city: orderData.shippingAddress.city || "",
            state: orderData.shippingAddress.state || "",
            postalCode: orderData.shippingAddress.postalCode || "",
            country: orderData.shippingAddress.country || "",
            phone: orderData.shippingAddress.phone || "",
          });
        }

        // Set customer info
        setCustomerPhone(
          orderData.customerPhone || orderData.shippingAddress?.phone || ""
        );
        setCustomerEmail(orderData.customerEmail || "");
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

  const handleSave = async () => {
    if (!order) return;

    // Validate status transition
    if (!canTransitionToStatus(order.status, status)) {
      toast.error(
        `Invalid status transition from ${order.status} to ${status}. Please select a valid status.`
      );
      return;
    }

    setIsSaving(true);
    try {
      // Update status
      await orderApi.updateOrderStatus(orderId, {
        status,
        notes: internalNotes,
      });

      // Update shipping if tracking info provided
      if (trackingId || carrier) {
        await orderApi.updateShipping(orderId, {
          trackingNumber: trackingId,
          courierName: carrier, // Will be properly cased now
          estimatedDeliveryDate,
        });
      }

      toast.success("Order updated successfully!");
      router.push(`/vendor/orders/${orderId}`);
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      await orderApi.cancelOrder(orderId, cancelReason);
      toast.success("Order cancelled successfully");
      setShowCancelDialog(false);
      loadOrder();
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      toast.error(error.response?.data?.message || "Failed to cancel order");
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    const configs = {
      pending: {
        color:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
        icon: Clock,
        label: "Pending",
        description: "Order awaiting confirmation",
      },
      confirmed: {
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        icon: CheckCircle,
        label: "Confirmed",
        description: "Order confirmed and ready for processing",
      },
      processing: {
        color:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
        icon: Package,
        label: "Processing",
        description: "Order is being prepared",
      },
      shipped: {
        color:
          "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-800",
        icon: Truck,
        label: "Shipped",
        description: "Order is in transit",
      },
      delivered: {
        color:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        icon: CheckCircle,
        label: "Delivered",
        description: "Order successfully delivered",
      },
      cancelled: {
        color:
          "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800",
        icon: XCircle,
        label: "Cancelled",
        description: "Order has been cancelled",
      },
      refunded: {
        color:
          "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-orange-200 dark:border-orange-800",
        icon: DollarSign,
        label: "Refunded",
        description: "Order has been refunded",
      },
    };

    return (
      configs[status] || {
        color:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
        icon: Package,
        label: "Unknown",
        description: "Status unknown",
      }
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-md"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/vendor/orders")}
                className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-gray-100 dark:via-blue-400 dark:to-gray-100 bg-clip-text text-transparent">
                  Edit Order
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {order.orderNumber || order.id}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        order.orderNumber || order.id || ""
                      );
                      toast.success("Order ID copied");
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className={`${statusConfig.color} flex items-center gap-2 px-4 py-2 border text-sm`}
                variant="outline"
              >
                <StatusIcon className="h-4 w-4" />
                {statusConfig.label}
              </Badge>
              <Badge
                variant="outline"
                className="bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 px-3 py-2"
              >
                <Shield className="h-3 w-3 mr-1" />
                Blockchain Secured
              </Badge>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status Info Banner */}
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl overflow-hidden">
            <div
              className={`absolute inset-0 bg-gradient-to-r ${statusConfig.color.includes("yellow") ? "from-yellow-500/5 via-transparent to-amber-500/5" : statusConfig.color.includes("blue") ? "from-blue-500/5 via-transparent to-cyan-500/5" : statusConfig.color.includes("green") ? "from-green-500/5 via-transparent to-emerald-500/5" : "from-gray-500/5 via-transparent to-slate-500/5"}`}
            />
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-r ${statusConfig.color.includes("yellow") ? "from-yellow-500 to-amber-500" : statusConfig.color.includes("blue") ? "from-blue-500 to-cyan-500" : statusConfig.color.includes("green") ? "from-green-500 to-emerald-500" : "from-gray-500 to-slate-500"} flex items-center justify-center shadow-lg`}
                >
                  <StatusIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {statusConfig.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {statusConfig.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/vendor/orders/${orderId}`)}
                  className="bg-white/50 dark:bg-gray-900/50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status & Tracking Card */}
            <Card
              className={`border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-100 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  Order Status & Tracking
                </CardTitle>
                <CardDescription>
                  Update order status and shipping information
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                {/* Status Selection */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Order Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value) => {
                      const newStatus = value as OrderStatus;
                      if (
                        canTransitionToStatus(
                          order?.status || "pending",
                          newStatus
                        )
                      ) {
                        setStatus(newStatus);
                      } else {
                        toast.error(
                          `Cannot change status from ${order?.status} to ${newStatus}`
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Show only allowed status transitions */}
                      {getAllowedStatusTransitions(
                        order?.status || "pending"
                      ).map((allowedStatus) => {
                        const statusConfigs = {
                          pending: {
                            icon: Clock,
                            color: "text-yellow-600",
                            label: "Pending",
                          },
                          confirmed: {
                            icon: CheckCircle,
                            color: "text-blue-600",
                            label: "Confirmed",
                          },
                          processing: {
                            icon: Package,
                            color: "text-indigo-600",
                            label: "Processing",
                          },
                          shipped: {
                            icon: Truck,
                            color: "text-green-600",
                            label: "Shipped",
                          },
                          delivered: {
                            icon: CheckCircle,
                            color: "text-emerald-600",
                            label: "Delivered",
                          },
                          cancelled: {
                            icon: XCircle,
                            color: "text-red-600",
                            label: "Cancelled",
                          },
                          refunded: {
                            icon: DollarSign,
                            color: "text-orange-600",
                            label: "Refunded",
                          },
                        };

                        const config =
                          statusConfigs[
                            allowedStatus as keyof typeof statusConfigs
                          ];
                        const Icon = config.icon;

                        return (
                          <SelectItem key={allowedStatus} value={allowedStatus}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${config.color}`} />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Current: <strong>{order?.status}</strong> • Only valid
                    transitions are shown
                  </p>
                </div>

                <Separator />

                {/* Shipping & Tracking - UPDATED CARRIER SELECT */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipping & Tracking Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackingId">Tracking Number</Label>
                      <Input
                        id="trackingId"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        placeholder="Enter tracking number"
                        className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="carrier">Shipping Carrier</Label>
                      <Select value={carrier} onValueChange={setCarrier}>
                        <SelectTrigger className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11">
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Use exact case matching from backend Order.js */}
                          <SelectItem value="FedEx">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              FedEx
                            </div>
                          </SelectItem>
                          <SelectItem value="UPS">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              UPS
                            </div>
                          </SelectItem>
                          <SelectItem value="USPS">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              USPS
                            </div>
                          </SelectItem>
                          <SelectItem value="DHL">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              DHL
                            </div>
                          </SelectItem>
                          <SelectItem value="Local">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Local Courier
                            </div>
                          </SelectItem>
                          <SelectItem value="Other">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Other
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Select the shipping carrier
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">
                      Estimated Delivery Date
                    </Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={estimatedDeliveryDate}
                      onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                      className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingNotes">Shipping Notes</Label>
                    <Textarea
                      id="shippingNotes"
                      value={shippingNotes}
                      onChange={(e) => setShippingNotes(e.target.value)}
                      placeholder="Add shipping instructions or notes..."
                      rows={3}
                      className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm"
                    />
                  </div>
                </div>

                <Separator />

                {/* Internal Notes */}
                <div className="space-y-2">
                  <Label
                    htmlFor="internalNotes"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Internal Notes
                  </Label>
                  <Textarea
                    id="internalNotes"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Add internal notes (not visible to customer)..."
                    rows={4}
                    className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    These notes are for internal use only
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Order Items Card */}
            <Card
              className={`border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  Order Items
                </CardTitle>
                <CardDescription>
                  {order.products?.length || 0} item
                  {order.products?.length !== 1 ? "s" : ""} in this order
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
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
                          className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-all group"
                        >
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {productImage ? (
                              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-md group-hover:shadow-lg transition-shadow">
                                <img
                                  src={productImage}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.parentElement!.innerHTML = `
                                      <div class="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                                        <svg class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                      </div>
                                    `;
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                                <Package className="h-10 w-10 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              {item.productName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Qty: {item.quantity}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />$
                                {item.price?.toFixed(2) || "0.00"} each
                              </span>
                              {item.sku && (
                                <>
                                  <span>•</span>
                                  <span className="text-xs">
                                    SKU: {item.sku}
                                  </span>
                                </>
                              )}
                            </div>
                            {item.productSnapshot?.category && (
                              <div className="mt-2 flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.productSnapshot.category}
                                </Badge>
                                {item.productSnapshot.subcategory && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.productSnapshot.subcategory}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              $
                              {item.subtotal?.toFixed(2) ||
                                (item.quantity * (item.price || 0)).toFixed(2)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Subtotal
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Package className="h-12 w12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No products in this order</p>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      ${order.subtotal?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {(order.shippingCost ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Shipping
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        ${(order.shippingCost ?? 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {(order.tax ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tax
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        ${(order.tax ?? 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Discount
                      </span>
                      <span className="font-medium">
                        -${order.discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address Card */}
            <Card
              className={`border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-300 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5" />
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      Shipping Address
                    </CardTitle>
                    <CardDescription>
                      Delivery location for this order
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="bg-white/50 dark:bg-gray-900/50 shadow-sm hover:shadow-md transition-all"
                  >
                    {isEditingAddress ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {isEditingAddress ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientName">Recipient Name</Label>
                      <Input
                        id="recipientName"
                        value={shippingAddress.name}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            name: e.target.value,
                          })
                        }
                        placeholder="Full name"
                        className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        value={shippingAddress.addressLine1}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            addressLine1: e.target.value,
                          })
                        }
                        placeholder="Street address"
                        className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">
                        Address Line 2 (Optional)
                      </Label>
                      <Input
                        id="addressLine2"
                        value={shippingAddress.addressLine2}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            addressLine2: e.target.value,
                          })
                        }
                        placeholder="Apartment, suite, etc."
                        className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              city: e.target.value,
                            })
                          }
                          className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={shippingAddress.state}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              state: e.target.value,
                            })
                          }
                          className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={shippingAddress.postalCode}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              postalCode: e.target.value,
                            })
                          }
                          className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={shippingAddress.country}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              country: e.target.value,
                            })
                          }
                          className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressPhone">Contact Phone</Label>
                      <Input
                        id="addressPhone"
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+1 (555) 000-0000"
                        className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Home className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-gray-700 dark:text-gray-300 space-y-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {shippingAddress.name || "No name provided"}
                        </p>
                        <p>{shippingAddress.addressLine1}</p>
                        {shippingAddress.addressLine2 && (
                          <p>{shippingAddress.addressLine2}</p>
                        )}
                        <p>
                          {shippingAddress.city}, {shippingAddress.state}{" "}
                          {shippingAddress.postalCode}
                        </p>
                        <p>{shippingAddress.country}</p>
                        {shippingAddress.phone && (
                          <p className="flex items-center gap-2 text-sm mt-2">
                            <Phone className="h-3 w-3" />
                            {shippingAddress.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Customer Information Card */}
            <Card
              className={`border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-100 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5" />
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Customer
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                    className="bg-white/50 dark:bg-gray-900/50 h-8 w-8 p-0"
                  >
                    {isEditingCustomer ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Edit className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Name
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {order.customerName}
                  </p>
                </div>

                <Separator />

                {isEditingCustomer ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Phone</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm h-11"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 break-all">
                        {order.customerEmail || customerEmail || "No email"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {order.customerPhone || customerPhone || "No phone"}
                      </span>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-white/50 dark:bg-gray-900/50"
                    onClick={() => {
                      if (order.customerEmail) {
                        window.location.href = `mailto:${order.customerEmail}`;
                      } else {
                        toast.error("No email address available");
                      }
                    }}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Button>
                  {order.customerPhone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-white/50 dark:bg-gray-900/50"
                      onClick={() => {
                        window.location.href = `tel:${order.customerPhone}`;
                      }}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Details Card */}
            <Card
              className={`border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-red-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Order ID
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                        {order.orderNumber || order.id}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            order.orderNumber || order.id || ""
                          );
                          toast.success("Order ID copied");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Created
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Last Updated
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(order.updatedAt)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Payment Method
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-white/50 dark:bg-gray-900/50"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      {order.paymentMethod || "Wallet"}
                    </Badge>
                  </div>

                  {order.paymentStatus && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Payment Status
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          order.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-800"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                        }
                      >
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Items
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {order.products?.length || 0} items
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                      Total Amount
                    </span>
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blockchain Information */}
            <Card
              className={`border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-300 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  Blockchain
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-3">
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              order.blockchainTxId || ""
                            );
                            toast.success("Transaction ID copied");
                          }}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-white/50 dark:bg-gray-900/50"
                    onClick={() => {
                      toast.info("Blockchain explorer coming soon");
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View on Explorer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card
              className={`border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl overflow-hidden transform transition-all duration-700 delay-400 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-all"
                  onClick={() => router.push(`/vendor/orders/${orderId}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Details
                </Button>

                {order.trackingId && (
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-all"
                    onClick={() => {
                      navigator.clipboard.writeText(order.trackingId!);
                      toast.success("Tracking ID copied to clipboard");
                    }}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Copy Tracking ID
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-all"
                  onClick={() => {
                    toast.info("Invoice generation coming soon");
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>

                <Separator className="my-3" />

                {order.status !== "cancelled" &&
                  order.status !== "delivered" &&
                  order.status !== "refunded" && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800 transition-all"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons - Bottom */}
        <div
          className={`flex items-center justify-between gap-4 transform transition-all duration-700 delay-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Button
            variant="outline"
            onClick={() => router.push("/vendor/orders")}
            className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={loadOrder}
              className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {order.orderNumber}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Cancellation Reason *</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows={4}
                className="bg-white/50 dark:bg-gray-900/50 border-0 shadow-sm"
              />
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> Cancelling this order will:
              </p>
              <ul className="text-xs text-red-700 dark:text-red-300 mt-2 space-y-1 ml-4 list-disc">
                <li>Notify the customer immediately</li>
                <li>Process any refunds if payment was made</li>
                <li>Update inventory quantities</li>
                <li>Record the cancellation on the blockchain</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason("");
              }}
              className="bg-white/50 dark:bg-gray-900/50"
            >
              Keep Order
            </Button>
            <Button
              onClick={handleCancelOrder}
              disabled={!cancelReason.trim()}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
