/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  MapPinIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  getOrderById,
  getOrderTimeline,
  cancelOrder,
} from "@/lib/api/customer.orders.api";
import type { Order } from "@/types";
import { usePageTitle } from "@/hooks/use-page-title";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: any;
    color: string;
    bg: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: ClockIcon,
    color: "text-gray-900 dark:text-white",
    bg: "bg-gray-100 dark:bg-gray-900",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircleIcon,
    color: "text-gray-900 dark:text-white",
    bg: "bg-gray-100 dark:bg-gray-900",
  },
  processing: {
    label: "Processing",
    icon: ClockIcon,
    color: "text-gray-900 dark:text-white",
    bg: "bg-gray-100 dark:bg-gray-900",
  },
  shipped: {
    label: "Shipped",
    icon: TruckIcon,
    color: "text-gray-900 dark:text-white",
    bg: "bg-gray-100 dark:bg-gray-900",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircleIcon,
    color: "text-gray-900 dark:text-white",
    bg: "bg-gray-100 dark:bg-gray-900",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircleIcon,
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900",
  },
  refunded: {
    label: "Refunded",
    icon: XCircleIcon,
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900",
  },
};

export default function OrderDetailPage() {
  usePageTitle("Order Details");
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);

      // Load order details
      const orderResponse = await getOrderById(orderId);
      if (orderResponse.success && orderResponse.data) {
        setOrder(orderResponse.data.order);
      } else {
        toast.error(orderResponse.message || "Failed to load order");
        router.push("/customer/orders");
        return;
      }

      // Try to load timeline (optional)
      try {
        const timelineResponse = await getOrderTimeline(orderId);
        if (timelineResponse.success && timelineResponse.data) {
          setTimeline((timelineResponse.data as any).timeline || []);
        }
      } catch {
        console.log("Timeline not available");
        // Timeline is optional, continue without it
      }
    } catch (error: any) {
      console.error("Error loading order:", error);
      toast.error(error.message || "Failed to load order details");
      router.push("/customer/orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleReorder = () => {
    toast.success("Reorder feature coming soon");
  };

  const handleDownloadInvoice = async () => {
    toast.success("Invoice download feature coming soon");
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setIsCancelling(true);

      const response = await cancelOrder(orderId, { reason: cancelReason });

      if (response.success) {
        toast.success(
          "Order cancelled successfully. Refund will be processed to your wallet."
        );
        setShowCancelModal(false);
        // Reload order details to show updated status
        loadOrderDetails();
      } else {
        toast.error(response.message || "Failed to cancel order");
      }
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  // Check if order can be cancelled (pending or confirmed status)
  const canCancelOrder =
    order && ["pending", "confirmed"].includes(order.status);

  // Check if order can be returned (delivered status and not already returned)
  const canRequestReturn =
    order && order.status === "delivered" && !order.returnRequested;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Order not found
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG["pending"];
  const StatusIcon = statusConfig.icon;

  // Get product ID for routing
  const getProductId = (productId: any) => {
    if (typeof productId === "string") return productId;
    return productId?._id || productId?.id || "";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/customer")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Home
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <button
              onClick={() => router.push("/customer/orders")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Orders
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              {order.orderNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  Order Details
                </p>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                  {order.orderNumber}
                </h1>
                <div
                  className={`flex items-center gap-2 px-4 py-2 ${statusConfig.bg}`}
                >
                  <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                  <span
                    className={`text-[10px] uppercase tracking-wider font-medium ${statusConfig.color}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                {order.paymentStatus === "refunded" && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-[10px] uppercase tracking-wider font-medium text-green-600 dark:text-green-400">
                      Refunded
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex gap-4 flex-wrap">
              {canCancelOrder && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="border border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  Cancel Order
                </button>
              )}
              {canRequestReturn && (
                <button
                  onClick={() =>
                    router.push(
                      `/customer/returns?orderId=${order._id || order.id}`
                    )
                  }
                  className="border border-orange-600 dark:border-orange-500 text-orange-600 dark:text-orange-500 px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors"
                >
                  Request Return
                </button>
              )}
              <button
                onClick={handleDownloadInvoice}
                className="bg-black dark:bg-white text-white dark:text-black px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
              >
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-16">
            {/* Left Column */}
            <div className="space-y-12">
              {/* Order Timeline */}
              {timeline.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider">
                    Order Timeline
                  </h2>
                  <div className="space-y-0">
                    {timeline.map((event: any, index: number) => (
                      <div key={index} className="flex gap-6">
                        {/* Timeline Line */}
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-black dark:bg-white" />
                          {index < timeline.length - 1 && (
                            <div
                              className="w-px flex-1 bg-black dark:bg-white"
                              style={{ minHeight: "60px" }}
                            />
                          )}
                        </div>

                        {/* Timeline Content */}
                        <div className="flex-1 pb-12">
                          <h3 className="text-sm font-medium uppercase tracking-wider mb-1 text-gray-900 dark:text-white">
                            {event.status || event.title}
                          </h3>
                          {event.timestamp && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(event.timestamp)}
                            </p>
                          )}
                          {event.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History (fallback if no timeline) */}
              {timeline.length === 0 && order.statusHistory && (
                <div className="space-y-6">
                  <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider">
                    Order History
                  </h2>
                  <div className="space-y-0">
                    {order.statusHistory.map((event: any, index: number) => (
                      <div key={index} className="flex gap-6">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-black dark:bg-white" />
                          {index < order.statusHistory!.length - 1 && (
                            <div
                              className="w-px flex-1 bg-black dark:bg-white"
                              style={{ minHeight: "60px" }}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-12">
                          <h3 className="text-sm font-medium uppercase tracking-wider mb-1 text-gray-900 dark:text-white">
                            {event.status}
                          </h3>
                          {event.timestamp && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(event.timestamp)}
                            </p>
                          )}
                          {event.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-6">
                <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider">
                  Order Items
                </h2>
                <div className="space-y-6">
                  {order.items.map((item, index) => {
                    const product =
                      typeof item.productId === "object"
                        ? item.productId
                        : null;
                    // Check multiple image sources: populated product, productSnapshot, or direct field
                    const productImage =
                      product?.images?.[0]?.url ||
                      item.productSnapshot?.images?.[0]?.url ||
                      item.productImage ||
                      "";
                    const productName =
                      product?.name || item.productName || "Product";
                    const productId = getProductId(item.productId);

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-[120px_1fr] gap-6 pb-6 border-b border-gray-200 dark:border-gray-800 last:border-0"
                      >
                        <div
                          className="relative bg-gray-100 dark:bg-gray-900 aspect-[3/4] cursor-pointer"
                          onClick={() =>
                            productId &&
                            router.push(`/customer/products/${productId}`)
                          }
                        >
                          {productImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={productImage}
                              alt={productName}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <CubeIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          {item.quantity > 1 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-medium">
                              {item.quantity}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-between">
                          <div className="space-y-2">
                            <button
                              onClick={() =>
                                productId &&
                                router.push(`/customer/products/${productId}`)
                              }
                              className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-left"
                            >
                              {productName}
                            </button>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              {item.productSnapshot?.apparelDetails?.color && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 dark:text-gray-600">
                                    Color:
                                  </span>
                                  <span>
                                    {item.productSnapshot.apparelDetails.color}
                                  </span>
                                </div>
                              )}
                              {item.productSnapshot?.apparelDetails?.size && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 dark:text-gray-600">
                                    Size:
                                  </span>
                                  <span>
                                    {item.productSnapshot.apparelDetails.size}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 dark:text-gray-600">
                                  Qty:
                                </span>
                                <span>{item.quantity}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-end justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              CVT {item.price.toFixed(2)} each
                            </span>
                            <span className="text-sm font-light text-gray-900 dark:text-white">
                              CVT {item.subtotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping Information */}
              <div className="space-y-6">
                <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Shipping Information
                </h2>
                <div className="border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.shippingAddress.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {order.shippingAddress.phone}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {order.shippingAddress.addressLine1}
                    </p>
                    {order.shippingAddress.addressLine2 && (
                      <p className="text-sm text-gray-900 dark:text-white">
                        {order.shippingAddress.addressLine2}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state}{" "}
                      {order.shippingAddress.postalCode}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.shippingAddress.country}
                    </p>
                  </div>
                  {order.trackingNumber && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">
                        Tracking Number
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {order.trackingNumber}
                        </p>
                        <button
                          onClick={() =>
                            order.trackingNumber &&
                            copyToClipboard(order.trackingNumber)
                          }
                          className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Blockchain Transaction */}
              {(order.transactionHash || order.blockchainTxHash) && (
                <div className="space-y-6">
                  <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5" />
                    Blockchain Transaction
                  </h2>
                  <div className="border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Transaction Hash
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-900 dark:text-white">
                          {(
                            order.transactionHash || order.blockchainTxHash
                          )?.slice(0, 10)}
                          ...
                          {(
                            order.transactionHash || order.blockchainTxHash
                          )?.slice(-8)}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              order.transactionHash ||
                                order.blockchainTxHash ||
                                ""
                            )
                          }
                          aria-label="Copy transaction hash"
                          className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                        </button>
                        <a
                          href={`https://explorer.example.com/tx/${order.transactionHash || order.blockchainTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="View transaction"
                          className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Payment Method
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {order.paymentMethod}
                      </span>
                    </div>

                    {order.paymentStatus && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Payment Status
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {order.paymentStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="border border-gray-200 dark:border-gray-800 p-8 space-y-6">
                <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider">
                  Order Summary
                </h2>

                <div className="space-y-4 py-6 border-y border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      CVT {order.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {order.shippingCost !== undefined &&
                    order.shippingCost > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Shipping
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          CVT {order.shippingCost.toFixed(2)}
                        </span>
                      </div>
                    )}
                  {order.tax !== undefined && order.tax > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tax
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        CVT {order.tax.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.discount !== undefined && order.discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Discount
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        -CVT {order.discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Total Paid
                  </span>
                  <span className="text-2xl font-light text-gray-900 dark:text-white">
                    CVT {order.total.toFixed(2)}
                  </span>
                </div>

                {/* Refund Information */}
                {order.paymentStatus === "refunded" && (
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">
                          Refunded
                        </span>
                      </div>
                      <span className="text-lg font-light text-green-600 dark:text-green-400">
                        CVT {(order.refundAmount || order.total).toFixed(2)}
                      </span>
                    </div>
                    {order.refundedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Refunded on {formatDate(order.refundedAt)}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      The amount has been returned to your wallet
                    </p>
                  </div>
                )}
              </div>

              {/* Need Help */}
              <div className="mt-6 border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                <h3 className="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                  Need Help?
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => toast.success("Support feature coming soon")}
                    className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Contact Support
                  </button>
                  <button
                    onClick={() => toast.success("Return feature coming soon")}
                    className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Return or Exchange
                  </button>
                  <button
                    onClick={() =>
                      toast.success("Tracking feature coming soon")
                    }
                    className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Track Shipment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => setShowCancelModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 max-w-md w-full p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                Cancel Order
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please provide a reason for cancelling this order. Your payment
                will be refunded to your wallet.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                Cancellation Reason *
              </label>
              <div className="border-b border-gray-900 dark:border-white pb-px">
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Changed my mind, found a better option, etc."
                  rows={4}
                  className="w-full px-0 py-2 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={isCancelling}
                className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling || !cancelReason.trim()}
                className="flex-1 bg-red-600 dark:bg-red-500 text-white h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
