/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { getOrders } from "@/lib/api/customer.orders.api";
import type { Order, OrderStatus } from "@/types";
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
  confirmed: {
    label: "Confirmed",
    icon: CheckCircleIcon,
    color: "text-gray-900 dark:text-white",
    bg: "bg-gray-100 dark:bg-gray-900",
  },
};

const FILTER_OPTIONS = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Highest Amount", value: "amount-desc" },
  { label: "Lowest Amount", value: "amount-asc" },
];

export default function OrdersPage() {
  usePageTitle("My Orders");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Load orders from API
  useEffect(() => {
    loadOrders();
  }, [selectedStatus, sortBy]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const filters: any = {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: sortBy === "newest" ? "desc" : "asc",
      };

      // Add status filter if not "all"
      if (selectedStatus !== "all") {
        filters.status = selectedStatus as OrderStatus;
      }

      // Adjust sortBy based on selection
      if (sortBy === "amount-desc" || sortBy === "amount-asc") {
        filters.sortBy = "total";
        filters.sortOrder = sortBy === "amount-desc" ? "desc" : "asc";
      }

      const response = await getOrders(filters);

      if (response.success && response.data) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.message || "Failed to load orders");
      }
    } catch (error: any) {
      console.error("Error loading orders:", error);
      toast.error(error.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by search query (client-side)
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(query) ||
      order.transactionHash?.toLowerCase().includes(query) ||
      order.blockchainTxHash?.toLowerCase().includes(query) ||
      order._id?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get order ID for routing
  const getOrderId = (order: Order) => {
    return order._id || order.id || "";
  };

  // Get display items count
  const getItemsCount = (order: Order) => {
    return order.items?.length || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/customer")}
              className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Home
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              Orders
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Order History
              </p>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
                My Orders
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pagination.totalItems}{" "}
                {pagination.totalItems === 1 ? "order" : "orders"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="py-6 space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3 border-b border-gray-900 dark:border-white pb-px">
                <input
                  type="text"
                  placeholder="Search by order ID or transaction hash"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-10 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="cursor-pointer text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="cursor-pointer flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  <FunnelIcon className="h-4 w-4" />
                  Sort
                </button>

                {filtersOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setFiltersOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 z-50">
                      <div className="p-2">
                        {SORT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setFiltersOpen(false);
                            }}
                            className={`cursor-pointer block w-full text-left px-4 py-3 text-xs transition-colors ${
                              sortBy === option.value
                                ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={`cursor-pointer px-5 h-10 text-[10px] uppercase tracking-[0.2em] font-medium whitespace-nowrap transition-all ${
                    selectedStatus === filter.value
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {filteredOrders.length > 0 ? (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const statusConfig =
                  STATUS_CONFIG[order.status] || STATUS_CONFIG["pending"];
                const StatusIcon = statusConfig.icon;
                const itemsCount = getItemsCount(order);
                const orderId = getOrderId(order);

                return (
                  <div
                    key={orderId}
                    className="border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all group cursor-pointer"
                    onClick={() => router.push(`/customer/orders/${orderId}`)}
                  >
                    <div className="p-8">
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                              {order.orderNumber}
                            </h3>
                            <div
                              className={`flex items-center gap-2 px-3 py-1 ${statusConfig.bg}`}
                            >
                              <StatusIcon
                                className={`h-3 w-3 ${statusConfig.color}`}
                              />
                              <span
                                className={`text-[10px] uppercase tracking-wider font-medium ${statusConfig.color}`}
                              >
                                {statusConfig.label}
                              </span>
                            </div>
                            {order.paymentStatus === "refunded" && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30">
                                <CheckCircleIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                                <span className="text-[10px] uppercase tracking-wider font-medium text-green-600 dark:text-green-400">
                                  Refunded
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatDate(order.createdAt)}</span>
                            <span>•</span>
                            <span>
                              {itemsCount} {itemsCount === 1 ? "item" : "items"}
                            </span>
                            {order.transactionHash && (
                              <>
                                <span>•</span>
                                <span className="font-mono">
                                  {order.transactionHash.slice(0, 10)}...
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right space-y-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Total
                            </p>
                            <p
                              className={`text-xl font-light ${order.paymentStatus === "refunded" ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"}`}
                            >
                              CVT {order.total.toFixed(2)}
                            </p>
                            {order.paymentStatus === "refunded" && (
                              <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wider">
                                ✓ Refunded
                              </p>
                            )}
                          </div>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {order.items.slice(0, 5).map((item, index) => {
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

                          return (
                            <div key={index} className="space-y-2">
                              <div className="relative bg-gray-100 dark:bg-gray-900 aspect-[3/4]">
                                {productImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={productImage}
                                    alt={productName}
                                    className="w-full h-full object-cover"
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
                              <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase tracking-wide line-clamp-1">
                                {productName}
                              </p>
                            </div>
                          );
                        })}
                        {itemsCount > 5 && (
                          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 aspect-[3/4]">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              +{itemsCount - 5} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-32">
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {searchQuery
                    ? "No orders match your search"
                    : "No orders found"}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStatus("all");
                    setSortBy("newest");
                  }}
                  className="cursor-pointer text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors underline"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Ensure buttons & links use pointer cursor consistently */
        button,
        a {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
