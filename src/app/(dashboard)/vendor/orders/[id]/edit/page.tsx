/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CubeIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  BanknotesIcon,
  MapPinIcon,
  ArrowLeftIcon,
  CheckIcon,
  ChartBarIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { orderApi } from "@/lib/api/vendor.order.api";
import { Order, OrderStatus } from "@/types";
import { toast } from "sonner";
import { colors, badgeColors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { usePageTitle } from "@/hooks/use-page-title";

const statusOptions: Array<{
  value: OrderStatus;
  label: string;
  icon: any;
  color: string;
  description: string;
}> = [
  {
    value: "pending",
    label: "Pending",
    icon: ClockIcon,
    color: "yellow",
    description: "Order received, awaiting confirmation",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    icon: CheckCircleIcon,
    color: "blue",
    description: "Order confirmed, ready for processing",
  },
  {
    value: "processing",
    label: "Processing",
    icon: ChartBarIcon,
    color: "cyan",
    description: "Order is being prepared",
  },
  {
    value: "shipped",
    label: "Shipped",
    icon: TruckIcon,
    color: "green",
    description: "Order has been shipped to customer",
  },
  {
    value: "delivered",
    label: "Delivered",
    icon: CheckCircleIcon,
    color: "green",
    description: "Order successfully delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: XCircleIcon,
    color: "red",
    description: "Order has been cancelled",
  },
  {
    value: "refunded",
    label: "Refunded",
    icon: BanknotesIcon,
    color: "amber",
    description: "Order refunded to customer",
  },
];

export default function VendorOrderEditPage() {
  usePageTitle("Edit Order");
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Form state
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<
    Date | undefined
  >();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setIsVisible(true);
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Auto-generate tracking ID when status changes to "shipped"
  useEffect(() => {
    if (status === "shipped" && !trackingNumber) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2, 8).toUpperCase();
      setTrackingNumber(`TRACK-${timestamp}-${random}`);
    }
  }, [status, trackingNumber]);

  const loadOrder = async () => {
    if (!orderId || orderId === "undefined") {
      toast.error("Invalid order ID");
      router.push("/vendor/orders");
      return;
    }

    setIsLoading(true);
    try {
      const response = await orderApi.getOrderById(orderId);

      if (response.success && response.order) {
        setOrder(response.order);
        setStatus(response.order.status);
        setTrackingNumber(
          response.order.trackingNumber || response.order.trackingId || ""
        );
        setCourierName(
          response.order.courierName || response.order.carrier || ""
        );
        setEstimatedDeliveryDate(
          response.order.estimatedDeliveryDate
            ? new Date(response.order.estimatedDeliveryDate)
            : undefined
        );
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

    // Validation
    if (status === "shipped" && !trackingNumber) {
      toast.error("Tracking number is required for shipped orders");
      return;
    }

    if (status === "shipped" && !courierName) {
      toast.error("Courier name is required for shipped orders");
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        status,
        notes,
      };

      // Add tracking info if provided
      if (trackingNumber) {
        updateData.trackingId = trackingNumber;
      }
      if (courierName) {
        updateData.carrier = courierName;
      }
      if (estimatedDeliveryDate) {
        updateData.estimatedDelivery = estimatedDeliveryDate
          .toISOString()
          .split("T")[0];
      }

      await orderApi.updateOrderStatus(order.id || order._id!, updateData);

      toast.success(`Order status updated to ${status}`);
      router.push(`/vendor/orders/${orderId}`);
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast.error(
        error.response?.data?.message || "Failed to update order status"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusConfig = (statusValue: OrderStatus) => {
    const config = statusOptions.find((opt) => opt.value === statusValue);
    if (!config) {
      return {
        color: `${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text}`,
        icon: CubeIcon,
        label: "Unknown",
      };
    }

    const colorMap: any = {
      yellow: badgeColors.yellow,
      blue: badgeColors.blue,
      cyan: badgeColors.cyan,
      green: badgeColors.green,
      red: badgeColors.red,
      amber: badgeColors.amber,
    };

    const colors = colorMap[config.color] || badgeColors.grey;

    return {
      color: `${colors.bg} ${colors.border} ${colors.text} border backdrop-blur-sm rounded-none`,
      icon: config.icon,
      label: config.label,
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "CVT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xs text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-2">
            Order Not Found
          </h3>
          <p className="text-xs text-gray-600 mb-4">
            The order you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <Button
            onClick={() => router.push("/vendor/orders")}
            className="text-xs"
          >
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`min-h-screen ${colors.backgrounds.secondary}`}>
      <div className="relative z-10 p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendor" className="text-xs">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendor/orders" className="text-xs">
                Orders
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs">Edit Order</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className={`text-base font-bold ${colors.texts.primary}`}>
                Edit Order {order.orderNumber}
              </h1>
              <p className={`text-xs ${colors.texts.secondary}`}>
                Update order status and shipping information
              </p>
              <Badge className={statusConfig.color} variant="outline">
                <StatusIcon className="h-3 w-3 mr-1" />
                Current: {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Update */}
            <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
              <CardHeader>
                <CardTitle className="text-xs">Update Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Selection */}
                <div className="space-y-2">
                  <Label className={`${colors.texts.primary} text-xs`}>
                    New Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as OrderStatus)}
                  >
                    <SelectTrigger
                      className={`${colors.inputs.base} rounded-none text-xs w-full`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => {
                        const OptionIcon = option.icon;
                        return (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <OptionIcon className="h-4 w-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {statusOptions.find((opt) => opt.value === status) && (
                    <p className={`text-xs ${colors.texts.secondary}`}>
                      {
                        statusOptions.find((opt) => opt.value === status)
                          ?.description
                      }
                    </p>
                  )}
                </div>

                {/* Status Notes */}
                <div className="space-y-2">
                  <Label className={`${colors.texts.primary} text-xs`}>
                    Status Notes (Optional)
                  </Label>
                  <Textarea
                    placeholder="Add notes about this status update..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={10}
                    maxLength={2000}
                    className={`${colors.inputs.base} rounded-none text-xs resize-none focus:ring-transparent focus:outline-none`}
                    style={{ boxShadow: "none" }}
                  />
                  <p className={`text-xs ${colors.texts.secondary}`}>
                    {notes.length} / 2000 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <AnimatePresence mode="wait">
              {status === "shipped" && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Card
                    className={`${colors.cards.base} rounded-none !shadow-none`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xs">
                        <TruckIcon
                          className={`h-4 w-4 ${colors.icons.primary}`}
                        />
                        Shipping Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Tracking Number */}
                      <div className="space-y-2">
                        <Label className={`${colors.texts.primary} text-xs`}>
                          Tracking Number{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Auto-generated tracking number"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className={`${colors.inputs.base} rounded-none text-xs`}
                        />
                      </div>

                      {/* Courier Name */}
                      <div className="space-y-2">
                        <Label className={`${colors.texts.primary} text-xs`}>
                          Courier Name <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={courierName}
                          onValueChange={setCourierName}
                        >
                          <SelectTrigger
                            className={`${colors.inputs.base} rounded-none text-xs w-full`}
                          >
                            <SelectValue placeholder="Select courier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FedEx" className="text-xs">
                              FedEx
                            </SelectItem>
                            <SelectItem value="UPS" className="text-xs">
                              UPS
                            </SelectItem>
                            <SelectItem value="DHL" className="text-xs">
                              DHL
                            </SelectItem>
                            <SelectItem value="USPS" className="text-xs">
                              USPS
                            </SelectItem>
                            <SelectItem value="Local" className="text-xs">
                              Local Courier
                            </SelectItem>
                            <SelectItem value="TCS" className="text-xs">
                              TCS
                            </SelectItem>
                            <SelectItem value="Leopard" className="text-xs">
                              Leopard
                            </SelectItem>
                            <SelectItem value="Other" className="text-xs">
                              Other
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Estimated Delivery Date */}
                      <div className="space-y-2">
                        <Label className={`${colors.texts.primary} text-xs`}>
                          Estimated Delivery Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`${colors.inputs.base} rounded-none text-xs w-full justify-start text-left font-normal`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {estimatedDeliveryDate ? (
                                format(estimatedDeliveryDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={estimatedDeliveryDate}
                              onSelect={setEstimatedDeliveryDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div
                        className={`p-4 ${badgeColors.blue.bg} border ${badgeColors.blue.border} rounded-none`}
                      >
                        <p className={`text-xs ${badgeColors.blue.text}`}>
                          <strong>Note:</strong> Tracking number auto-generated.
                          Courier name is required.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className={`${colors.buttons.primary} rounded-none px-8 text-xs`}
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/vendor/orders/${orderId}`)}
                disabled={isSaving}
                className="rounded-none text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Overview */}
            <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
              <CardHeader>
                <CardTitle className="text-xs">Order Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Order Number
                  </p>
                  <p className={`text-xs font-medium ${colors.texts.primary}`}>
                    {order.orderNumber}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Order Date
                  </p>
                  <p className={`text-xs font-medium ${colors.texts.primary}`}>
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Total Amount
                  </p>
                  <p className={`text-sm font-bold ${colors.texts.primary}`}>
                    {formatCurrency(order.total || order.totalAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Items
                  </p>
                  <p className={`text-xs font-medium ${colors.texts.primary}`}>
                    {order.products?.length || order.items?.length || 0} item
                    {(order.products?.length || order.items?.length || 0) !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs">
                  <UserIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Name
                  </p>
                  <p className={`text-xs font-medium ${colors.texts.primary}`}>
                    {order.customerName}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Email
                  </p>
                  <p className={`text-xs ${colors.texts.primary}`}>
                    {order.customerEmail || "N/A"}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Phone
                  </p>
                  <p className={`text-xs ${colors.texts.primary}`}>
                    {order.customerPhone ||
                      order.shippingAddress?.phone ||
                      "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xs">
                    <MapPinIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`p-3 ${colors.backgrounds.tertiary} rounded-none`}
                  >
                    <p
                      className={`text-xs font-medium ${colors.texts.primary} mb-2`}
                    >
                      {order.shippingAddress.name}
                    </p>
                    <p className={`text-xs ${colors.texts.secondary}`}>
                      {order.shippingAddress.addressLine1}
                      {order.shippingAddress.addressLine2 && (
                        <>, {order.shippingAddress.addressLine2}</>
                      )}
                    </p>
                    <p className={`text-xs ${colors.texts.secondary}`}>
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state}{" "}
                      {order.shippingAddress.postalCode}
                    </p>
                    <p className={`text-xs ${colors.texts.secondary}`}>
                      {order.shippingAddress.country}
                    </p>
                    {order.shippingAddress.phone && (
                      <p className={`text-xs ${colors.texts.secondary} mt-2`}>
                        Phone: {order.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Shipping Info */}
            {(order.trackingNumber ||
              order.trackingId ||
              order.courierName ||
              order.carrier) && (
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none`}
              >
                <CardHeader>
                  <CardTitle className="text-xs">
                    Current Shipping Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(order.trackingNumber || order.trackingId) && (
                    <div>
                      <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                        Tracking Number
                      </p>
                      <p
                        className={`font-mono text-xs ${colors.texts.primary}`}
                      >
                        {order.trackingNumber || order.trackingId}
                      </p>
                    </div>
                  )}
                  {(order.courierName || order.carrier) && (
                    <div>
                      <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                        Courier
                      </p>
                      <p
                        className={`text-xs font-medium ${colors.texts.primary}`}
                      >
                        {order.courierName || order.carrier}
                      </p>
                    </div>
                  )}
                  {order.estimatedDeliveryDate && (
                    <div>
                      <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                        Estimated Delivery
                      </p>
                      <p
                        className={`text-xs font-medium ${colors.texts.primary}`}
                      >
                        {formatDate(order.estimatedDeliveryDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
