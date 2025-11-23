/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  TruckIcon,
  CubeIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  InboxArrowDownIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { badgeColors, colors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { notificationApi, Notification } from "@/lib/api/notification.api";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/use-page-title";

const notificationTypes = [
  "All Types",
  "Order Placed",
  "Order Confirmed",
  "Order Shipped",
  "Order Delivered",
  "Order Cancelled",
  "Vendor Request Created",
  "Vendor Request Approved",
  "Vendor Request Rejected",
  "Vendor Request Cancelled",
  "Vendor Request Updated",
  "Vendor Request Fulfilled",
  "Vendor Request Completed",
  "Request Order Placed",
  "Request Payment Received",
  "Payment",
  "Payment Received",
  "Payment Sent",
  "Payment Failed",
  "Transaction",
  "Transaction Completed",
  "Transaction Failed",
  "Product",
  "Product Added",
  "Product Updated",
  "Product Removed",
  "Inventory",
  "Inventory Low",
  "Inventory Updated",
  "Blockchain",
  "Blockchain Verified",
  "Blockchain Failed",
  "Alert",
  "Notification",
  "System",
];

const statusOptions = ["All Status", "Read", "Unread"];

export default function NotificationsPage() {
  usePageTitle("Notifications");
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setIsVisible(true);
    loadNotifications();
  }, [user?.id]);

  // Listen for markAllAsRead event from header
  useEffect(() => {
    const handler = async () => {
      await loadNotifications();
    };
    window.addEventListener("notifications:markAllAsRead", handler);
    return () =>
      window.removeEventListener("notifications:markAllAsRead", handler);
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      console.log("🔔 Fetching notifications...");
      const response = await notificationApi.getNotifications();
      console.log("✅ Notifications response:", response);

      const notifs = response.notifications || [];
      setNotifications(notifs);
    } catch (error: any) {
      console.error("❌ Failed to load notifications:", error);
      toast.error(error.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      console.log("📬 Marking notification as read:", notificationId);
      await notificationApi.markAsRead(notificationId);
      await loadNotifications();
      toast.success("Notification marked as read");
    } catch (error: any) {
      console.error("❌ Failed to mark as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log("📬 Marking all notifications as read...");
      await notificationApi.markAllAsRead();
      await loadNotifications();
      toast.success("All notifications marked as read");
      // Dispatch event so header can also update
      window.dispatchEvent(new Event("notifications:markAllAsRead"));
    } catch (error: any) {
      console.error("❌ Failed to mark all as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      // Order related
      order_placed: ShoppingCartIcon,
      order_confirmed: CheckCircleIcon,
      order_shipped: TruckIcon,
      order_delivered: CheckCircleIcon,
      order_cancelled: ExclamationCircleIcon,

      // Vendor request related - ALL USE DocumentTextIcon
      vendor_request_created: InboxArrowDownIcon,
      vendor_request_approved: CheckCircleIcon,
      vendor_request_rejected: ExclamationTriangleIcon,
      vendor_request_cancelled: ExclamationTriangleIcon,
      vendor_request_updated: DocumentTextIcon,
      vendor_request_fulfilled: CheckCircleIcon,
      vendor_request_completed: CheckCircleIcon,
      request_order_placed: ShoppingCartIcon,
      vendor_request_payment_received: BanknotesIcon,

      // Payment related
      payment: CurrencyDollarIcon,
      payment_received: CurrencyDollarIcon,
      payment_sent: CurrencyDollarIcon,
      payment_failed: ExclamationCircleIcon,

      // Transaction related
      transaction: CheckCircleIcon,
      transaction_completed: CheckCircleIcon,
      transaction_failed: ExclamationCircleIcon,

      // Product related
      product: CubeIcon,
      product_added: CubeIcon,
      product_updated: CubeIcon,
      product_removed: ExclamationCircleIcon,

      // Inventory related
      inventory: TruckIcon,
      inventory_low: ExclamationCircleIcon,
      inventory_updated: TruckIcon,

      // Blockchain related
      blockchain: CubeIcon,
      blockchain_verified: CheckCircleIcon,
      blockchain_failed: ExclamationCircleIcon,

      // General
      alert: ExclamationCircleIcon,
      notification: BellIcon,
      system: Cog6ToothIcon,
    };
    return iconMap[type] || BellIcon;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Helper to map display label to backend type
  const notificationTypeLabelToType: Record<string, string> = {
    "Order Placed": "order_placed",
    "Order Confirmed": "order_confirmed",
    "Order Shipped": "order_shipped",
    "Order Delivered": "order_delivered",
    "Order Cancelled": "order_cancelled",
    "Vendor Request Created": "vendor_request_created",
    "Vendor Request Approved": "vendor_request_approved",
    "Vendor Request Rejected": "vendor_request_rejected",
    "Vendor Request Cancelled": "vendor_request_cancelled",
    "Vendor Request Updated": "vendor_request_updated",
    "Vendor Request Fulfilled": "vendor_request_fulfilled",
    "Vendor Request Completed": "vendor_request_completed",
    "Request Order Placed": "request_order_placed",
    "Request Payment Received": "request_payment_received",
    Payment: "payment",
    "Payment Received": "payment_received",
    "Payment Sent": "payment_sent",
    "Payment Failed": "payment_failed",
    Transaction: "transaction",
    "Transaction Completed": "transaction_completed",
    "Transaction Failed": "transaction_failed",
    Product: "product",
    "Product Added": "product_added",
    "Product Updated": "product_updated",
    "Product Removed": "product_removed",
    Inventory: "inventory",
    "Inventory Low": "inventory_low",
    "Inventory Updated": "inventory_updated",
    Blockchain: "blockchain",
    "Blockchain Verified": "blockchain_verified",
    "Blockchain Failed": "blockchain_failed",
    Alert: "alert",
    Notification: "notification",
    System: "system",
  };

  const filteredNotifications = useMemo(() => {
    // Sort: unread first, then by createdAt desc
    const sorted = [...notifications].sort((a, b) => {
      if (a.isRead === b.isRead) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return a.isRead ? 1 : -1; // unread first
    });
    return sorted.filter((notification) => {
      const matchesSearch =
        notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      // Fix: map selectedType label to backend type
      let matchesType = true;
      if (selectedType !== "All Types") {
        const backendType = notificationTypeLabelToType[selectedType];
        matchesType = notification.type === backendType;
      }

      const matchesStatus =
        selectedStatus === "All Status" ||
        (selectedStatus === "read" && notification.isRead) ||
        (selectedStatus === "unread" && !notification.isRead);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchTerm, selectedType, selectedStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className={`min-h-screen ${colors.backgrounds.secondary}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-none w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-none"></div>
          </div>
        </div>
      </div>
    );
  }

  // Routing logic copied from dashboard-header
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead) {
        await notificationApi.markAsRead(notification._id);
        await loadNotifications();
      }

      // ========================================
      // VENDOR REQUEST NOTIFICATIONS - ALL GO TO VENDOR-REQUESTS PAGE
      // ========================================
      if (
        notification.type === "vendor_request_created" ||
        notification.type === "vendor_request_approved" ||
        notification.type === "vendor_request_rejected" ||
        notification.type === "vendor_request_cancelled" ||
        notification.type === "vendor_request_updated" ||
        notification.type === "vendor_request_fulfilled" ||
        notification.type === "vendor_request_completed" ||
        notification.type === "request_order_placed" ||
        notification.type === "vendor_request_payment_received" ||
        notification.type.includes("vendor_request") ||
        notification.type.includes("request_")
      ) {
        const requestNumber =
          notification.relatedEntity?.entityData?.requestNumber ||
          notification.metadata?.requestNumber ||
          notification.message.match(/REQ-\d+-\d+/)?.[0] ||
          "";

        const requestsPage =
          user?.role === "vendor"
            ? "/vendor/my-requests"
            : "/supplier/vendor-requests";

        if (requestNumber) {
          window.location.href = `${requestsPage}?search=${requestNumber}`;
        } else {
          window.location.href = requestsPage;
        }
        return;
      }

      // ========================================
      // ORDER NOTIFICATIONS
      // ========================================
      if (notification.type.includes("order")) {
        const orderNumber =
          notification.relatedEntity?.entityData?.orderNumber ||
          notification.message.match(/ORD-\d+-\d+/)?.[0] ||
          "";

        if (
          notification.type === "order_completed" ||
          notification.type === "order_delivered"
        ) {
          const transactionPage =
            user?.role === "vendor"
              ? "/vendor/transactions"
              : "/supplier/transactions";
          if (orderNumber) {
            window.location.href = `${transactionPage}?search=${orderNumber}`;
          } else {
            window.location.href = transactionPage;
          }
          return;
        }

        const ordersPage =
          user?.role === "vendor" ? "/vendor/orders" : "/supplier/transactions";
        if (orderNumber) {
          window.location.href = `${ordersPage}?search=${orderNumber}`;
        } else {
          window.location.href = ordersPage;
        }
        return;
      }

      // ========================================
      // PAYMENT NOTIFICATIONS
      // ========================================
      if (
        notification.type === "payment_received" ||
        notification.type === "payment_sent" ||
        notification.type.includes("payment")
      ) {
        window.location.href = "/wallet";
        return;
      }

      // ========================================
      // USE DYNAMIC actionUrl FROM BACKEND IF AVAILABLE
      // ========================================
      if (notification.action?.url) {
        window.location.href = notification.action.url;
        return;
      }

      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
        return;
      }

      // ========================================
      // FALLBACK ROUTING BY TYPE
      // ========================================
      const routes: Record<string, string> = {
        transaction:
          user?.role === "vendor"
            ? "/vendor/transactions"
            : "/supplier/transactions",
        transaction_completed:
          user?.role === "vendor"
            ? "/vendor/transactions"
            : "/supplier/transactions",

        product_added:
          user?.role === "vendor" ? "/vendor/my-products" : "/vendor/browse",
        product_updated:
          user?.role === "vendor" ? "/vendor/my-products" : "/vendor/browse",

        inventory_updated:
          user?.role === "supplier"
            ? "/supplier/inventory"
            : "/vendor/my-inventory",
        inventory_low:
          user?.role === "supplier"
            ? "/supplier/inventory"
            : "/vendor/my-inventory",
      };

      const route =
        routes[notification.type] ||
        (user?.role === "vendor" ? "/vendor" : "/supplier");
      window.location.href = route;
    } catch (err) {
      // Optionally show error
      toast.error("Failed to handle notification click");
    }
  };

  return (
    <div className={`min-h-screen ${colors.backgrounds.secondary}`}>
      <div className="relative z-10 p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={user?.role === "vendor" ? "/vendor" : "/supplier"}
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Notifications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                Notifications
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Stay updated with your latest activities and alerts
              </p>
              <div className="flex items-center gap-2 mt-2">
                {unreadCount > 0 && (
                  <Badge
                    className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none flex items-center gap-1`}
                  >
                    <BellIcon className={`h-3 w-3 ${badgeColors.blue.icon}`} />
                    {unreadCount} Unread
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadNotifications}
                variant="outline"
                className={`flex items-center gap-2 text-xs cursor-pointer ${colors.buttons.outline} transition-all rounded-none`}
              >
                <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  className={`flex items-center gap-2 text-xs cursor-pointer ${colors.buttons.primary} transition-all rounded-none`}
                >
                  <CheckCircleIcon
                    className={`h-4 w-4 ${colors.texts.inverse}`}
                  />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className={`${colors.cards.base} rounded-none`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <FunnelIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                Filters & Search
              </CardTitle>
              <CardDescription className={`text-xs ${colors.texts.secondary}`}>
                Filter and search through your notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative w-full">
                  <MagnifyingGlassIcon
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                  />
                  <Input
                    placeholder="Search notifications"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${colors.inputs.base} pl-9 h-9 w-full min-w-[240px] ${colors.inputs.focus} transition-colors duration-200`}
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-none">
                    {notificationTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="text-sm h-9"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-none">
                    {statusOptions.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="text-sm h-9"
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  {searchTerm && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${colors.backgrounds.primary} ${colors.borders.primary} ${colors.texts.secondary} rounded-none`}
                    >
                      &quot;{searchTerm}&quot;
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedType !== "All Types" && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${colors.backgrounds.primary} ${colors.borders.primary} ${colors.texts.secondary} rounded-none`}
                    >
                      {selectedType}
                      <button
                        onClick={() => setSelectedType("All Types")}
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedStatus !== "All Status" && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${colors.backgrounds.primary} ${colors.borders.primary} ${colors.texts.secondary} rounded-none`}
                    >
                      {selectedStatus}
                      <button
                        onClick={() => setSelectedStatus("All Status")}
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                    {filteredNotifications.length} notifications found
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {filteredNotifications.length > 0 ? (
            <Card
              className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardHeader
                className={`border-b ${colors.borders.primary} rounded-none`}
              >
                <CardTitle
                  className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                >
                  <BellIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                  All Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {paginatedNotifications.map((notification) => {
                    const IconComponent = getNotificationIcon(
                      notification.type
                    );
                    return (
                      <div
                        key={notification._id}
                        className={`flex items-start gap-4 p-6 border-b ${colors.borders.secondary} ${colors.backgrounds.hover} transition-all cursor-pointer ${
                          !notification.isRead
                            ? "bg-gray-100 dark:bg-gray-700/50"
                            : ""
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-1 h-full bg-gray-400 dark:bg-gray-500 -ml-6"></div>
                        )}
                        <div className="flex-shrink-0 pt-0.5">
                          <IconComponent
                            className={`h-4 w-4 ${
                              !notification.isRead
                                ? "text-gray-800 dark:text-gray-200"
                                : colors.icons.primary
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          {notification.title && (
                            <h4
                              className={`font-semibold text-sm ${colors.texts.primary}`}
                            >
                              {notification.title}
                            </h4>
                          )}
                          <p
                            className={`text-xs ${colors.texts.secondary} leading-relaxed`}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <ClockIcon
                              className={`h-3.5 w-3.5 ${colors.icons.muted}`}
                            />
                            <span className={`text-xs ${colors.texts.muted}`}>
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <div className="flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              className={`h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none`}
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                              Mark Read
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none px-2"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <span className="text-xs">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none px-2"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card
              className={`text-center py-16 ${colors.cards.base} overflow-hidden rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardContent>
                <div
                  className={`h-20 w-20 mx-auto mb-6 flex items-center justify-center ${colors.backgrounds.accent} backdrop-blur-sm rounded-none`}
                >
                  <BellIcon className={`h-10 w-10 ${colors.texts.muted}`} />
                </div>
                <h3
                  className={`text-base font-semibold ${colors.texts.primary} mb-2`}
                >
                  {notifications.length === 0
                    ? "No Notifications Yet"
                    : "No Notifications Found"}
                </h3>
                <p
                  className={`text-xs ${colors.texts.secondary} mb-6 max-w-md mx-auto`}
                >
                  {notifications.length === 0
                    ? "You'll receive notifications for orders, requests, and system updates here."
                    : "Try adjusting your search terms or filters to find notifications."}
                </p>
                {notifications.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedType("All Types");
                      setSelectedStatus("All Status");
                    }}
                    className={`inline-flex items-center gap-2 cursor-pointer ${colors.buttons.outline} rounded-none`}
                  >
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
