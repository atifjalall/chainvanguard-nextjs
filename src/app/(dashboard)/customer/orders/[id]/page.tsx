"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Mock Order Detail Data
const ORDER_DATA = {
  id: "ORD-2024-001",
  date: "2024-11-15",
  status: "delivered",
  transactionHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
  blockNumber: "18234567",
  networkFee: 2.5,
  shippingInfo: {
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+92 300 1234567",
    address: "123 Main Street",
    city: "Karachi",
    state: "Sindh",
    zipCode: "75500",
    country: "Pakistan",
  },
  shippingMethod: {
    name: "Standard Shipping",
    cost: 5.99,
    estimatedDays: "5-7 business days",
  },
  timeline: [
    {
      status: "Order Placed",
      date: "2024-11-15 10:30 AM",
      completed: true,
    },
    {
      status: "Payment Confirmed",
      date: "2024-11-15 10:32 AM",
      completed: true,
    },
    {
      status: "Processing",
      date: "2024-11-15 02:15 PM",
      completed: true,
    },
    {
      status: "Shipped",
      date: "2024-11-16 09:00 AM",
      completed: true,
    },
    {
      status: "Out for Delivery",
      date: "2024-11-18 08:30 AM",
      completed: true,
    },
    {
      status: "Delivered",
      date: "2024-11-18 03:45 PM",
      completed: true,
    },
  ],
  products: [
    {
      id: 1,
      name: "Premium Cotton T-Shirt",
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
      quantity: 2,
      price: 29.99,
      size: "M",
      color: "Black",
    },
    {
      id: 2,
      name: "Classic Denim Jacket",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
      quantity: 1,
      price: 89.99,
      size: "L",
      color: "Blue",
    },
  ],
};

const STATUS_CONFIG = {
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
};

export default function OrderDetailPage() {
  const router = useRouter();
  const order = ORDER_DATA;
  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  const subtotal = order.products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal + order.shippingMethod.cost + order.networkFee;

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
    toast.success("Items added to cart");
    router.push("/customer/cart");
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
              {order.id}
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
                  {order.id}
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
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Placed on {formatDate(order.date)}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReorder}
                className="border border-black dark:border-white text-black dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Reorder
              </button>
              <button
                onClick={() => toast.success("Invoice downloaded")}
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
              <div className="space-y-6">
                <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider">
                  Order Timeline
                </h2>
                <div className="space-y-0">
                  {order.timeline.map((event, index) => (
                    <div key={index} className="flex gap-6">
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 ${
                            event.completed
                              ? "bg-black dark:bg-white"
                              : "border-2 border-gray-300 dark:border-gray-700"
                          }`}
                        />
                        {index < order.timeline.length - 1 && (
                          <div
                            className={`w-px flex-1 ${
                              event.completed
                                ? "bg-black dark:bg-white"
                                : "bg-gray-200 dark:bg-gray-800"
                            }`}
                            style={{ minHeight: "60px" }}
                          />
                        )}
                      </div>

                      {/* Timeline Content */}
                      <div className="flex-1 pb-12">
                        <h3
                          className={`text-sm font-medium uppercase tracking-wider mb-1 ${
                            event.completed
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-400 dark:text-gray-600"
                          }`}
                        >
                          {event.status}
                        </h3>
                        {event.date && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {event.date}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-6">
                <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider">
                  Order Items
                </h2>
                <div className="space-y-6">
                  {order.products.map((product) => (
                    <div
                      key={product.id}
                      className="grid grid-cols-[120px_1fr] gap-6 pb-6 last:border-0"
                    >
                      <div
                        className="relative bg-gray-100 dark:bg-gray-900 aspect-[3/4] cursor-pointer"
                        onClick={() =>
                          router.push(`/customer/products/${product.id}`)
                        }
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                        {product.quantity > 1 && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-medium">
                            {product.quantity}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between">
                        <div className="space-y-2">
                          <button
                            onClick={() =>
                              router.push(`/customer/products/${product.id}`)
                            }
                            className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-left"
                          >
                            {product.name}
                          </button>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 dark:text-gray-600">
                                Color:
                              </span>
                              <span>{product.color}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 dark:text-gray-600">
                                Size:
                              </span>
                              <span>{product.size}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 dark:text-gray-600">
                                Qty:
                              </span>
                              <span>{product.quantity}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-end justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Rs {product.price.toFixed(2)} each
                          </span>
                          <span className="text-sm font-light text-gray-900 dark:text-white">
                            Rs {(product.price * product.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Information */}
              <div className="space-y-6">
                <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Shipping Information
                </h2>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.shippingInfo.fullName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {order.shippingInfo.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.shippingInfo.phone}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {order.shippingInfo.address}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.shippingInfo.city}, {order.shippingInfo.state}{" "}
                      {order.shippingInfo.zipCode}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.shippingInfo.country}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">
                      Shipping Method
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {order.shippingMethod.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {order.shippingMethod.estimatedDays}
                    </p>
                  </div>
                </div>
              </div>

              {/* Blockchain Transaction */}
              <div className="space-y-6">
                <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Blockchain Transaction
                </h2>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction Hash
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-900 dark:text-white">
                        {order.transactionHash.slice(0, 10)}...
                        {order.transactionHash.slice(-8)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(order.transactionHash)}
                        aria-label="Copy transaction hash"
                        className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                      <a
                        href={`https://etherscan.io/tx/${order.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View transaction on Etherscan"
                        className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Block Number
                    </span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      {order.blockNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Network Fee
                    </span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      Rs {order.networkFee.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="p-8 space-y-6">
                <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider">
                  Order Summary
                </h2>

                <div className="space-y-4 py-6 border-y border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      Rs {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      Rs {order.shippingMethod.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Network Fee
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      Rs {order.networkFee.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Total Paid
                  </span>
                  <span className="text-2xl font-light text-gray-900 dark:text-white">
                    Rs {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Need Help */}
              <div className="mt-6 p-6 space-y-4">
                <h3 className="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                  Need Help?
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => toast.success("Support contacted")}
                    className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Contact Support
                  </button>
                  <button
                    onClick={() => router.push("/customer/returns")}
                    className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Return or Exchange
                  </button>
                  <button
                    onClick={() => toast.success("Tracking info sent")}
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
    </div>
  );
}
