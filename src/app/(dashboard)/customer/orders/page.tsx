/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/_ui/card";
import { Button } from "@/components/_ui/button";
import { Badge } from "@/components/_ui/badge";
import { Progress } from "@/components/_ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/_ui/tabs";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Eye,
  MessageCircle,
  AlertCircle,
  Home,
  Star,
  Plane,
} from "lucide-react";

const mockActiveOrders = [
  {
    id: "ORD-2025-007",
    date: "2025-08-15",
    status: "shipped",
    total: 156.78,
    estimatedDelivery: "2025-08-18",
    trackingId: "TRK-2025-007",
    items: [
      {
        id: "1",
        name: "Wireless Gaming Mouse",
        quantity: 1,
        price: 89.99,
        vendor: "Tech Solutions Inc.",
      },
      {
        id: "2",
        name: "Mouse Pad Pro",
        quantity: 1,
        price: 24.99,
        vendor: "Gaming Gear Co.",
      },
    ],
    currentLocation: "Distribution Center - Frankfurt, DE",
    progress: 75,
    trackingSteps: [
      {
        step: "Order Confirmed",
        completed: true,
        date: "2025-08-15",
        time: "10:30 AM",
      },
      {
        step: "Payment Processed",
        completed: true,
        date: "2025-08-15",
        time: "10:35 AM",
      },
      {
        step: "Preparing Shipment",
        completed: true,
        date: "2025-08-15",
        time: "2:45 PM",
      },
      { step: "Shipped", completed: true, date: "2025-08-16", time: "9:15 AM" },
      {
        step: "In Transit",
        completed: true,
        date: "2025-08-16",
        time: "11:30 AM",
      },
      {
        step: "Out for Delivery",
        completed: false,
        date: "2025-08-18",
        time: "Expected",
      },
      {
        step: "Delivered",
        completed: false,
        date: "2025-08-18",
        time: "Expected",
      },
    ],
    vendor: "Multiple Vendors",
    canCancel: false,
    priority: "standard",
  },
  {
    id: "ORD-2025-008",
    date: "2025-08-16",
    status: "processing",
    total: 245.5,
    estimatedDelivery: "2025-08-20",
    trackingId: "TRK-2025-008",
    items: [
      {
        id: "3",
        name: "Premium Coffee Beans",
        quantity: 3,
        price: 29.99,
        vendor: "Green Farm Co.",
      },
      {
        id: "4",
        name: "French Press Coffee Maker",
        quantity: 1,
        price: 155.53,
        vendor: "Kitchen Essentials",
      },
    ],
    currentLocation: "Vendor Facility - Processing",
    progress: 25,
    trackingSteps: [
      {
        step: "Order Confirmed",
        completed: true,
        date: "2025-08-16",
        time: "3:20 PM",
      },
      {
        step: "Payment Processed",
        completed: true,
        date: "2025-08-16",
        time: "3:25 PM",
      },
      {
        step: "Preparing Shipment",
        completed: false,
        date: "2025-08-17",
        time: "In Progress",
      },
      {
        step: "Shipped",
        completed: false,
        date: "2025-08-17",
        time: "Expected",
      },
      {
        step: "In Transit",
        completed: false,
        date: "2025-08-18",
        time: "Expected",
      },
      {
        step: "Out for Delivery",
        completed: false,
        date: "2025-08-20",
        time: "Expected",
      },
      {
        step: "Delivered",
        completed: false,
        date: "2025-08-20",
        time: "Expected",
      },
    ],
    vendor: "Multiple Vendors",
    canCancel: true,
    priority: "express",
  },
  {
    id: "ORD-2025-009",
    date: "2025-08-16",
    status: "confirmed",
    total: 67.98,
    estimatedDelivery: "2025-08-19",
    trackingId: null,
    items: [
      {
        id: "5",
        name: "Eco Water Bottle",
        quantity: 2,
        price: 22.99,
        vendor: "Green Living Co.",
      },
      {
        id: "6",
        name: "Bamboo Utensil Set",
        quantity: 1,
        price: 21.99,
        vendor: "Eco Accessories",
      },
    ],
    currentLocation: "Order Processing",
    progress: 15,
    trackingSteps: [
      {
        step: "Order Confirmed",
        completed: true,
        date: "2025-08-16",
        time: "6:45 PM",
      },
      {
        step: "Payment Processed",
        completed: false,
        date: "2025-08-17",
        time: "Pending",
      },
      {
        step: "Preparing Shipment",
        completed: false,
        date: "2025-08-17",
        time: "Pending",
      },
      {
        step: "Shipped",
        completed: false,
        date: "2025-08-17",
        time: "Pending",
      },
      {
        step: "In Transit",
        completed: false,
        date: "2025-08-18",
        time: "Pending",
      },
      {
        step: "Out for Delivery",
        completed: false,
        date: "2025-08-19",
        time: "Pending",
      },
      {
        step: "Delivered",
        completed: false,
        date: "2025-08-19",
        time: "Pending",
      },
    ],
    vendor: "Multiple Vendors",
    canCancel: true,
    priority: "standard",
  },
];

export default function MyOrdersPage() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"active" | "tracking">(
    "active"
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          color:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          icon: Clock,
          label: "Confirmed",
        };
      case "processing":
        return {
          color:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
          icon: Package,
          label: "Processing",
        };
      case "shipped":
        return {
          color:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          icon: Truck,
          label: "Shipped",
        };
      case "delivered":
        return {
          color:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: CheckCircle,
          label: "Delivered",
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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const ActiveOrderCard = ({ order }: { order: any }) => {
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
              {order.priority === "express" && (
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  <Plane className="h-3 w-3 mr-1" />
                  Express
                </Badge>
              )}
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                Order Progress
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {order.progress}%
              </span>
            </div>
            <Progress value={order.progress} className="h-2 mb-2" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {order.currentLocation}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Est. {formatDate(order.estimatedDelivery)}
              </span>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Delivery: {formatDate(order.estimatedDelivery)}
              </p>
            </div>
          </div>

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
              {order.trackingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTab("tracking")}
                  className="h-9 w-9 p-0 text-gray-600 dark:text-gray-400 hover:text-blue-600"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-gray-600 dark:text-gray-400 hover:text-blue-600"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>

              {order.canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-gray-600 dark:text-gray-400 hover:text-red-600"
                >
                  <AlertCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TrackingView = ({ order }: { order: any }) => (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          Order Tracking - {order.id}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Current Location
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {order.currentLocation}
              </p>
            </div>
            <Badge className={getStatusConfig(order.status).color}>
              {getStatusConfig(order.status).label}
            </Badge>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="space-y-4">
          {order.trackingSteps.map((step: any, index: number) => (
            <div key={index} className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                  step.completed
                    ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-400"
                    : "bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    step.completed
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {step.step}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.date} • {step.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Estimated Delivery */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-3 text-base">
            <Home className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Estimated delivery:
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatDate(order.estimatedDelivery)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const stats = [
    {
      label: "Active Orders",
      value: mockActiveOrders.length,
      icon: Package,
    },
    {
      label: "In Transit",
      value: mockActiveOrders.filter((o) => o.status === "shipped").length,
      icon: Truck,
    },
    {
      label: "Processing",
      value: mockActiveOrders.filter((o) => o.status === "processing").length,
      icon: Clock,
    },
    {
      label: "Total Value",
      value: `$${mockActiveOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}`,
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                My Orders
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your orders and delivery status
              </p>
            </div>
          </div>

          {/* Tab Toggle */}
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab as any}
            className="w-auto"
          >
            <TabsList className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Package className="h-4 w-4 mr-2" />
                Active Orders
              </TabsTrigger>
              <TabsTrigger
                value="tracking"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Track Orders
              </TabsTrigger>
            </TabsList>
          </Tabs>
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

      {/* Main Content */}
      <div
        className={`transform transition-all duration-700 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab as any}>
          <TabsContent value="active" className="space-y-6 mt-0">
            {mockActiveOrders.length > 0 ? (
              mockActiveOrders.map((order) => (
                <ActiveOrderCard key={order.id} order={order} />
              ))
            ) : (
              <Card className="text-center py-16 border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <CardContent>
                  <div className="h-20 w-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    No active orders
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    You don&apos;t have any orders in progress
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6 mt-0">
            {mockActiveOrders
              .filter((order) => order.trackingId)
              .map((order) => (
                <TrackingView key={order.id} order={order} />
              ))}

            {mockActiveOrders.filter((order) => order.trackingId).length ===
              0 && (
              <Card className="text-center py-16 border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <CardContent>
                  <div className="h-20 w-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <MapPin className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    No trackable orders
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Orders with tracking information will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
