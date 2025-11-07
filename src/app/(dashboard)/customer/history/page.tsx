/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/_ui/card";
import { Button } from "@/components/_ui/button";
import { Input } from "@/components/_ui/input";
import { Badge } from "@/components/_ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/_ui/select";
import {
  Search,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
  Star,
  Filter,
  TrendingUp,
  History,
} from "lucide-react";

const mockOrderHistory = [
  {
    id: "ORD-2025-001",
    date: "2025-08-10",
    status: "delivered",
    total: 289.97,
    deliveryDate: "2025-08-12",
    items: [
      {
        name: "Premium Cotton T-Shirt",
        quantity: 2,
        price: 29.99,
        vendor: "Fashion Hub",
      },
      {
        name: "Wireless Bluetooth Headphones",
        quantity: 1,
        price: 199.99,
        vendor: "Tech Solutions Inc.",
      },
      {
        name: "Organic Coffee Beans",
        quantity: 1,
        price: 29.99,
        vendor: "Green Farm Co.",
      },
    ],
    trackingId: "TRK-2025-001",
    rating: 5,
    reviewed: true,
  },
  {
    id: "ORD-2025-002",
    date: "2025-08-05",
    status: "delivered",
    total: 156.78,
    deliveryDate: "2025-08-07",
    items: [
      {
        name: "Yoga Exercise Mat",
        quantity: 1,
        price: 49.99,
        vendor: "FitLife Store",
      },
      {
        name: "Plant-Based Protein Powder",
        quantity: 2,
        price: 39.99,
        vendor: "Nutrition Plus",
      },
      { name: "Water Bottle", quantity: 1, price: 26.8, vendor: "Eco Living" },
    ],
    trackingId: "TRK-2025-002",
    rating: 4,
    reviewed: true,
  },
  {
    id: "ORD-2025-003",
    date: "2025-08-01",
    status: "delivered",
    total: 324.95,
    deliveryDate: "2025-08-03",
    items: [
      {
        name: "Gaming Mouse",
        quantity: 1,
        price: 89.99,
        vendor: "Tech Solutions Inc.",
      },
      {
        name: "Mechanical Keyboard",
        quantity: 1,
        price: 159.99,
        vendor: "Tech Solutions Inc.",
      },
      {
        name: "Monitor Stand",
        quantity: 1,
        price: 74.97,
        vendor: "Office Essentials",
      },
    ],
    trackingId: "TRK-2025-003",
    rating: 5,
    reviewed: true,
  },
  {
    id: "ORD-2025-004",
    date: "2025-07-28",
    status: "delivered",
    total: 67.98,
    deliveryDate: "2025-07-30",
    items: [
      {
        name: "Eco-Friendly Plates",
        quantity: 1,
        price: 45.99,
        vendor: "Green Living Co.",
      },
      {
        name: "Bamboo Cutlery Set",
        quantity: 1,
        price: 21.99,
        vendor: "Eco Accessories",
      },
    ],
    trackingId: "TRK-2025-004",
    rating: 4,
    reviewed: false,
  },
  {
    id: "ORD-2025-005",
    date: "2025-07-25",
    status: "cancelled",
    total: 45.5,
    cancelDate: "2025-07-25",
    items: [
      {
        name: "Specialty Tea Collection",
        quantity: 1,
        price: 45.5,
        vendor: "Tea Masters",
      },
    ],
    trackingId: null,
    cancelReason: "Out of stock",
  },
  {
    id: "ORD-2025-006",
    date: "2025-07-20",
    status: "delivered",
    total: 189.99,
    deliveryDate: "2025-07-22",
    items: [
      {
        name: "Smart Watch",
        quantity: 1,
        price: 189.99,
        vendor: "Tech Gadgets Pro",
      },
    ],
    trackingId: "TRK-2025-006",
    rating: 3,
    reviewed: true,
  },
  {
    id: "ORD-2025-007",
    date: "2025-07-15",
    status: "returned",
    total: 129.99,
    returnDate: "2025-07-25",
    items: [
      {
        name: "Bluetooth Speaker",
        quantity: 1,
        price: 129.99,
        vendor: "Audio Excellence",
      },
    ],
    trackingId: "TRK-2025-007",
    returnReason: "Defective product",
    refundAmount: 129.99,
  },
];

const statusOptions = ["All Status", "delivered", "cancelled", "returned"];
const sortOptions = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "total-desc", label: "Highest Amount" },
  { value: "total-asc", label: "Lowest Amount" },
  { value: "status", label: "Status" },
];

export default function OrderHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const filteredAndSortedOrders = useMemo(() => {
    const filtered = mockOrderHistory.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(
          (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.vendor.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "All Status" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "total-desc":
          return b.total - a.total;
        case "total-asc":
          return a.total - b.total;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, statusFilter, sortBy]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "delivered":
        return {
          color:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          icon: CheckCircle,
          label: "Delivered",
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          icon: XCircle,
          label: "Cancelled",
        };
      case "returned":
        return {
          color:
            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
          icon: RotateCcw,
          label: "Returned",
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: Package,
          label: "Unknown",
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
          ({rating}/5)
        </span>
      </div>
    );
  };

  const OrderHistoryCard = ({ order }: { order: any }) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedOrder === order.id;

    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <CardContent className="p-6">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                <StatusIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {order.id}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ordered {formatDate(order.date)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Order Summary */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                {order.items.length} item{order.items.length > 1 ? "s" : ""}
              </span>
              {order.trackingId && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Tracking: {order.trackingId}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ${order.total.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Status Specific Info */}
          {order.status === "delivered" && order.deliveryDate && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700 dark:text-green-400">
                  Delivered {formatDate(order.deliveryDate)}
                </span>
                {order.rating && <div>{renderStarRating(order.rating)}</div>}
              </div>
            </div>
          )}

          {order.status === "cancelled" && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                Cancelled: {order.cancelReason}
              </p>
            </div>
          )}

          {order.status === "returned" && (
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Returned: {order.returnReason} • Refund: ${order.refundAmount}
              </p>
            </div>
          )}

          {/* Items Details */}
          {!isExpanded ? (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {order.items
                  .map((item: any) => `${item.quantity}× ${item.name}`)
                  .join(", ")}
              </p>
            </div>
          ) : (
            <div className="mb-4 space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {order.items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {item.quantity}× {item.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        by {item.vendor}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleOrderExpansion(order.id)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {isExpanded ? "Show Less" : "View Details"}
            </Button>

            <div className="flex items-center gap-2">
              {order.status === "delivered" && !order.reviewed && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Star className="h-4 w-4 mr-1" />
                  Review
                </Button>
              )}

              {order.status === "delivered" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-gray-600 dark:text-gray-400 hover:text-orange-600"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-gray-600 dark:text-gray-400 hover:text-blue-600"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate stats
  const totalOrders = mockOrderHistory.length;
  const totalSpent = mockOrderHistory
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const deliveredOrders = mockOrderHistory.filter(
    (o) => o.status === "delivered"
  ).length;
  const avgRating = mockOrderHistory
    .filter((o) => o.rating)
    .reduce((sum, o, _, arr) => sum + (o.rating || 0) / arr.length, 0);

  const stats = [
    { label: "Total Orders", value: totalOrders, icon: Package },
    {
      label: "Total Spent",
      value: `$${totalSpent.toFixed(2)}`,
      icon: TrendingUp,
    },
    { label: "Delivered", value: deliveredOrders, icon: CheckCircle },
    {
      label: "Avg Rating",
      value: avgRating > 0 ? avgRating.toFixed(1) : "N/A",
      icon: Star,
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <History className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Order History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all your completed orders
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`transform transition-all duration-700 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div
        className={`transform transition-all duration-700 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center">
                <Filter className="h-3 w-3 text-white" />
              </div>
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders, products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredAndSortedOrders.length} of {mockOrderHistory.length}{" "}
                  orders
                </p>
              </div>

              {/* Active Filters */}
              <div className="flex gap-2">
                {searchTerm && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    {searchTerm}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {statusFilter !== "All Status" && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    {statusFilter}
                    <button
                      onClick={() => setStatusFilter("All Status")}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div
        className={`transform transition-all duration-700 delay-600 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {filteredAndSortedOrders.length > 0 ? (
          <div className="space-y-6">
            {filteredAndSortedOrders.map((order) => (
              <OrderHistoryCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-16 border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <CardContent>
              <div className="h-20 w-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                No orders found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Try adjusting your search terms or filters to find what
                you&apos;re looking for
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All Status");
                }}
                className="border-gray-200 dark:border-gray-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
