/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CubeIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  CurrencyDollarIcon,
  HomeIcon,
  MapPinIcon,
  PencilIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { orderApi } from "@/lib/api/vendor.order.api";
import { Order, OrderStatus } from "@/types";
import { toast } from "sonner";
import { colors, badgeColors } from "@/lib/colorConstants";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function VendorOrderViewPage() {
  usePageTitle("Order Details");
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

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
          color: `${badgeColors.yellow.bg} ${badgeColors.yellow.border} ${badgeColors.yellow.text} border backdrop-blur-sm rounded-none`,
          icon: ClockIcon,
          label: "Pending",
        };
      case "confirmed":
        return {
          color: `${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} border backdrop-blur-sm rounded-none`,
          icon: CheckCircleIcon,
          label: "Confirmed",
        };
      case "processing":
        return {
          color: `${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} border backdrop-blur-sm rounded-none`,
          icon: ChartBarIcon,
          label: "Processing",
        };
      case "shipped":
        return {
          color: `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} border backdrop-blur-sm rounded-none`,
          icon: TruckIcon,
          label: "Shipped",
        };
      case "delivered":
        return {
          color: `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} border backdrop-blur-sm rounded-none`,
          icon: CheckCircleIcon,
          label: "Delivered",
        };
      case "cancelled":
        return {
          color: `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} border backdrop-blur-sm rounded-none`,
          icon: XCircleIcon,
          label: "Cancelled",
        };
      case "refunded":
        return {
          color: `${badgeColors.amber.bg} ${badgeColors.amber.border} ${badgeColors.amber.text} border backdrop-blur-sm rounded-none`,
          icon: CurrencyDollarIcon,
          label: "Refunded",
        };
      default:
        return {
          color: `${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} border backdrop-blur-sm rounded-none`,
          icon: CubeIcon,
          label: "Unknown",
        };
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "CVT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatAddress = (address: Order["shippingAddress"]) => {
    if (!address) return "N/A";
    return `${address.addressLine1 || ""}${address.addressLine2 ? ", " + address.addressLine2 : ""}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
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
        <Breadcrumb>
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
              <BreadcrumbPage className="text-xs">
                {order.orderNumber}
              </BreadcrumbPage>
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
                Order {order.orderNumber}
              </h1>
              <p className={`text-xs ${colors.texts.secondary}`}>
                Placed on {formatDate(order.createdAt)}
              </p>
              <Badge className={statusConfig.color} variant="outline">
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              {order.status !== "delivered" &&
                order.status !== "cancelled" &&
                order.status !== "refunded" && (
                  <Button
                    onClick={() =>
                      router.push(`/vendor/orders/${orderId}/edit`)
                    }
                    className={`${colors.buttons.primary} rounded-none text-xs`}
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Order
                  </Button>
                )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs">
                  <UserIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                      Name
                    </p>
                    <p
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      {order.customerName}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                      Email
                    </p>
                    <p
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      {order.customerEmail || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                      Phone
                    </p>
                    <p
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      {order.customerPhone ||
                        order.shippingAddress?.phone ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                      Wallet Address
                    </p>
                    <p
                      className={`font-mono text-xs ${colors.texts.primary} truncate`}
                    >
                      {order.customerWalletAddress || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs">
                  <CubeIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  Order Items (
                  {order.products?.length || order.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(order.products || order.items || []).map(
                  (item: any, index: number) => {
                    const productImage =
                      item.productSnapshot?.images?.[0]?.url ||
                      item.productSnapshot?.images?.[0]?.cloudinaryUrl ||
                      item.productImage ||
                      item.image ||
                      null;

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 ${colors.backgrounds.tertiary} ${colors.borders.primary} rounded-none`}
                      >
                        <div className="flex items-center gap-4">
                          {productImage ? (
                            <div className="w-16 h-20 bg-gray-200/80 dark:bg-gray-700/60 backdrop-blur-sm overflow-hidden">
                              <img
                                src={productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className={`w-16 h-20 flex items-center justify-center ${colors.backgrounds.accent}`}
                            >
                              <CubeIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h4
                              className={`text-xs font-medium ${colors.texts.primary} mb-1`}
                            >
                              {item.productName}
                            </h4>
                            <p className={`text-xs ${colors.texts.secondary}`}>
                              Quantity: {item.quantity} @{" "}
                              {formatCurrency(item.price || 0)}
                            </p>
                            {item.sku && (
                              <p
                                className={`text-xs ${colors.texts.secondary} mt-1`}
                              >
                                SKU: {item.sku}
                              </p>
                            )}
                            {item.productSnapshot?.apparelDetails && (
                              <div
                                className={`text-xs ${colors.texts.secondary} mt-1 flex gap-2`}
                              >
                                {item.productSnapshot.apparelDetails.size && (
                                  <span>
                                    Size:{" "}
                                    {item.productSnapshot.apparelDetails.size}
                                  </span>
                                )}
                                {item.productSnapshot.apparelDetails.color && (
                                  <span>
                                    Color:{" "}
                                    {item.productSnapshot.apparelDetails.color}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xs font-bold ${colors.texts.primary}`}
                          >
                            {formatCurrency(
                              item.subtotal || item.quantity * (item.price || 0)
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xs">
                    <HomeIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`p-4 ${colors.backgrounds.tertiary} rounded-none`}
                  >
                    <p
                      className={`text-xs font-medium ${colors.texts.primary} mb-2`}
                    >
                      {order.shippingAddress.name}
                    </p>
                    <p className={`text-xs ${colors.texts.secondary}`}>
                      {formatAddress(order.shippingAddress)}
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

            {/* Status History */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xs">
                    <DocumentTextIcon
                      className={`h-4 w-4 ${colors.icons.primary}`}
                    />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.statusHistory.map((history: any, index: number) => {
                      const historyStatusConfig = getStatusConfig(
                        history.status
                      );
                      const HistoryIcon = historyStatusConfig.icon;

                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 ${colors.backgrounds.tertiary} rounded-none`}
                        >
                          <HistoryIcon className="h-5 w-5 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-xs font-medium ${colors.texts.primary}`}
                              >
                                {historyStatusConfig.label}
                              </p>
                              <p
                                className={`text-xs ${colors.texts.secondary}`}
                              >
                                {formatDate(history.timestamp)}
                              </p>
                            </div>
                            {history.notes && (
                              <p
                                className={`text-xs ${colors.texts.secondary} mt-1`}
                              >
                                {history.notes}
                              </p>
                            )}
                            {history.changedByRole && (
                              <p
                                className={`text-xs ${colors.texts.secondary} mt-1`}
                              >
                                Updated by: {history.changedByRole}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary & Details */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
              <CardHeader>
                <CardTitle className="text-xs">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className={colors.texts.secondary}>Subtotal</span>
                  <span className={colors.texts.primary}>
                    {formatCurrency(order.subtotal || 0)}
                  </span>
                </div>
                {order.shippingCost ? (
                  <div className="flex justify-between text-xs">
                    <span className={colors.texts.secondary}>Shipping</span>
                    <span className={colors.texts.primary}>
                      {formatCurrency(order.shippingCost)}
                    </span>
                  </div>
                ) : null}
                {order.tax ? (
                  <div className="flex justify-between text-xs">
                    <span className={colors.texts.secondary}>Tax</span>
                    <span className={colors.texts.primary}>
                      {formatCurrency(order.tax)}
                    </span>
                  </div>
                ) : null}
                {order.discount ? (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                ) : null}
                <Separator />
                <div className="flex justify-between text-xs font-bold">
                  <span className={colors.texts.primary}>Total</span>
                  <span className={colors.texts.primary}>
                    {formatCurrency(order.total || order.totalAmount || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Details */}
            {(order.trackingNumber ||
              order.trackingId ||
              order.courierName ||
              order.estimatedDeliveryDate) && (
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xs">
                    <MapPinIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                    Shipping Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.trackingNumber || order.trackingId ? (
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
                  ) : null}
                  {order.courierName || order.carrier ? (
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
                  ) : null}
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
                  {order.trackingUrl && (
                    <Button
                      variant="outline"
                      className="w-full rounded-none text-xs"
                      onClick={() => window.open(order.trackingUrl, "_blank")}
                    >
                      <TruckIcon className="h-4 w-4 mr-2" />
                      Track Shipment
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs">
                  <CurrencyDollarIcon
                    className={`h-4 w-4 ${colors.icons.primary}`}
                  />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Payment Method
                  </p>
                  <p className={`text-xs font-medium ${colors.texts.primary}`}>
                    {order.paymentMethod
                      ? order.paymentMethod
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Payment Status
                  </p>
                  <Badge
                    className={`${
                      order.paymentStatus === "paid"
                        ? badgeColors.green.bg + " " + badgeColors.green.text
                        : order.paymentStatus === "failed"
                          ? badgeColors.red.bg + " " + badgeColors.red.text
                          : badgeColors.yellow.bg +
                            " " +
                            badgeColors.yellow.text
                    } rounded-none text-xs`}
                    variant="outline"
                  >
                    {order.paymentStatus || "pending"}
                  </Badge>
                </div>
                {order.transactionHash && (
                  <div>
                    <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                      Transaction Hash
                    </p>
                    <p
                      className={`font-mono text-xs ${colors.texts.primary} break-all`}
                    >
                      {order.transactionHash}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blockchain Information */}
            {(order.blockchainOrderId ||
              order.blockchainTxId ||
              order.blockchainTxHash) && (
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xs">
                    <ShieldCheckIcon
                      className={`h-4 w-4 ${colors.icons.primary}`}
                    />
                    Blockchain Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.blockchainOrderId && (
                    <div>
                      <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                        Blockchain Order ID
                      </p>
                      <p
                        className={`font-mono text-xs ${colors.texts.primary} break-all`}
                      >
                        {order.blockchainOrderId}
                      </p>
                    </div>
                  )}
                  {(order.blockchainTxId || order.blockchainTxHash) && (
                    <div>
                      <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                        Transaction ID
                      </p>
                      <p
                        className={`font-mono text-xs ${colors.texts.primary} break-all`}
                      >
                        {order.blockchainTxId || order.blockchainTxHash}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Notes */}
            {(order.customerNotes ||
              order.specialInstructions ||
              order.isGift) && (
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none`}
              >
                <CardHeader>
                  <CardTitle className="text-xs">Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.customerNotes && (
                    <div>
                      <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                        Customer Notes
                      </p>
                      <p className={`text-xs ${colors.texts.primary}`}>
                        {order.customerNotes}
                      </p>
                    </div>
                  )}
                  {order.specialInstructions && (
                    <div>
                      <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                        Special Instructions
                      </p>
                      <p className={`text-xs ${colors.texts.primary}`}>
                        {order.specialInstructions}
                      </p>
                    </div>
                  )}
                  {order.isGift && (
                    <div>
                      <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                        Gift Message
                      </p>
                      <p className={`text-xs ${colors.texts.primary}`}>
                        {order.giftMessage || "This is a gift order"}
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
