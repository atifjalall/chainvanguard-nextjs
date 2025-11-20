"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// Mock Orders Data
const ORDERS_DATA = [
  {
    id: "ORD-2024-001",
    date: "2024-11-15",
    status: "delivered",
    items: 3,
    total: 209.97,
    transactionHash: "0x1a2b3c4d5e6f7g8h9i0j",
    products: [
      {
        id: 1,
        name: "Premium Cotton T-Shirt",
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200",
        quantity: 2,
        price: 29.99,
      },
      {
        id: 2,
        name: "Classic Denim Jacket",
        image:
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200",
        quantity: 1,
        price: 89.99,
      },
    ],
  },
  {
    id: "ORD-2024-002",
    date: "2024-11-12",
    status: "shipped",
    items: 2,
    total: 169.98,
    transactionHash: "0x9i8h7g6f5e4d3c2b1a0j",
    products: [
      {
        id: 3,
        name: "Casual Sneakers",
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200",
        quantity: 1,
        price: 79.99,
      },
      {
        id: 4,
        name: "Sport Watch",
        image:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
        quantity: 1,
        price: 149.99,
      },
    ],
  },
  {
    id: "ORD-2024-003",
    date: "2024-11-10",
    status: "processing",
    items: 1,
    total: 59.99,
    transactionHash: "0xabcdef1234567890abcd",
    products: [
      {
        id: 5,
        name: "Summer Dress",
        image:
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=200",
        quantity: 1,
        price: 59.99,
      },
    ],
  },
  {
    id: "ORD-2024-004",
    date: "2024-11-08",
    status: "delivered",
    items: 4,
    total: 289.96,
    transactionHash: "0x0987654321fedcba0987",
    products: [
      {
        id: 6,
        name: "Leather Wallet",
        image:
          "https://images.unsplash.com/photo-1627123424574-724758594e93?w=200",
        quantity: 2,
        price: 39.99,
      },
      {
        id: 7,
        name: "Casual Backpack",
        image:
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200",
        quantity: 1,
        price: 69.99,
      },
      {
        id: 8,
        name: "Designer Sunglasses",
        image:
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200",
        quantity: 1,
        price: 129.99,
      },
    ],
  },
  {
    id: "ORD-2024-005",
    date: "2024-11-05",
    status: "cancelled",
    items: 1,
    total: 189.99,
    transactionHash: "0xfedcba9876543210fedc",
    products: [
      {
        id: 9,
        name: "Winter Coat",
        image:
          "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=200",
        quantity: 1,
        price: 189.99,
      },
    ],
  },
  {
    id: "ORD-2024-006",
    date: "2024-11-03",
    status: "delivered",
    items: 2,
    total: 149.98,
    transactionHash: "0x1122334455667788990a",
    products: [
      {
        id: 10,
        name: "Wool Sweater",
        image:
          "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200",
        quantity: 1,
        price: 79.99,
      },
      {
        id: 11,
        name: "Casual Backpack",
        image:
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200",
        quantity: 1,
        price: 69.99,
      },
    ],
  },
];

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

const FILTER_OPTIONS = [
  { label: "All Orders", value: "all" },
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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter and sort orders
  const filteredOrders = ORDERS_DATA.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.transactionHash.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "oldest":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "amount-desc":
        return b.total - a.total;
      case "amount-asc":
        return a.total - b.total;
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
            <div className="flex items-center gap-3">
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
                {filteredOrders.length}{" "}
                {filteredOrders.length === 1 ? "order" : "orders"}
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
                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
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
                            className={`block w-full text-left px-4 py-3 text-xs transition-colors ${
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
                  className={`px-5 h-10 text-[10px] uppercase tracking-[0.2em] font-medium whitespace-nowrap transition-all ${
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
                const statusConfig = STATUS_CONFIG[order.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={order.id}
                    className="hover:border-black dark:hover:border-white transition-all group cursor-pointer"
                    onClick={() => router.push(`/customer/orders/${order.id}`)}
                  >
                    <div className="p-8">
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                              {order.id}
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
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatDate(order.date)}</span>
                            <span>•</span>
                            <span>
                              {order.items}{" "}
                              {order.items === 1 ? "item" : "items"}
                            </span>
                            <span>•</span>
                            <span className="font-mono">
                              {order.transactionHash.slice(0, 10)}...
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                              Total
                            </p>
                            <p className="text-xl font-light text-gray-900 dark:text-white">
                              Rs {order.total.toFixed(2)}
                            </p>
                          </div>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {order.products.slice(0, 5).map((product) => (
                          <div key={product.id} className="space-y-2">
                            <div className="relative bg-gray-100 dark:bg-gray-900 aspect-[3/4]">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                              {product.quantity > 1 && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-medium">
                                  {product.quantity}
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase tracking-wide line-clamp-1">
                              {product.name}
                            </p>
                          </div>
                        ))}
                        {order.products.length > 5 && (
                          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 aspect-[3/4]">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              +{order.products.length - 5} more
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
                  No orders found
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStatus("all");
                    setSortBy("newest");
                  }}
                  className="text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors underline"
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
      `}</style>
    </div>
  );
}
