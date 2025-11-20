"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CubeIcon,
  CalendarIcon,
  BellIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
  ShoppingBagIcon,
  TagIcon,
  ExclamationCircleIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Mock Transaction Data
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "order",
    title: "Order Delivered",
    message: "Your order #ORD12345 has been delivered successfully.",
    timestamp: "2024-01-18T10:30:00",
    read: false,
    link: "/customer/orders/ORD12345",
  },
  {
    id: "2",
    type: "return",
    title: "Return Approved",
    message:
      "Your return request #RET001 has been approved. Please ship the item back.",
    timestamp: "2024-01-17T15:45:00",
    read: false,
    link: "/customer/return/RET001",
  },
  {
    id: "3",
    type: "refund",
    title: "Refund Processed",
    message: "$89.99 has been refunded to your wallet for order #ORD12340.",
    timestamp: "2024-01-16T09:20:00",
    read: false,
    link: "/customer/wallet",
  },
  {
    id: "4",
    type: "order",
    title: "Order Shipped",
    message: "Your order #ORD12346 has been shipped. Track your package now.",
    timestamp: "2024-01-15T14:00:00",
    read: true,
    link: "/customer/orders/ORD12346",
  },
  {
    id: "5",
    type: "promotion",
    title: "Special Offer - 20% Off",
    message:
      "Get 20% off on all winter collection items. Use code WINTER20 at checkout.",
    timestamp: "2024-01-14T08:00:00",
    read: true,
    link: "/customer/browse",
  },
  {
    id: "6",
    type: "order",
    title: "Order Confirmed",
    message: "Your order #ORD12347 has been confirmed and is being processed.",
    timestamp: "2024-01-13T11:30:00",
    read: true,
    link: "/customer/orders/ORD12347",
  },
  {
    id: "7",
    type: "system",
    title: "Profile Updated",
    message: "Your profile information has been updated successfully.",
    timestamp: "2024-01-12T16:45:00",
    read: true,
    link: "/customer/profile",
  },
  {
    id: "8",
    type: "return",
    title: "Return Received",
    message:
      "We have received your returned item for order #ORD12340. Refund is being processed.",
    timestamp: "2024-01-11T10:15:00",
    read: true,
    link: "/customer/return/RET002",
  },
  {
    id: "9",
    type: "promotion",
    title: "New Arrivals",
    message:
      "Check out our latest collection of premium clothing and accessories.",
    timestamp: "2024-01-10T09:00:00",
    read: true,
    link: "/customer/browse",
  },
  {
    id: "10",
    type: "order",
    title: "Order Out for Delivery",
    message: "Your order #ORD12345 is out for delivery and will arrive today.",
    timestamp: "2024-01-09T07:30:00",
    read: true,
    link: "/customer/orders/ORD12345",
  },
];

type FilterType =
  | "all"
  | "order"
  | "return"
  | "refund"
  | "promotion"
  | "system";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filterType === "all") return true;
    return notif.type === filterType;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadFilteredCount = filteredNotifications.filter(
    (n) => !n.read
  ).length;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBagIcon className="h-5 w-5" />;
      case "return":
        return <ArrowPathIcon className="h-5 w-5" />;
      case "refund":
        return <CubeIcon className="h-5 w-5" />;
      case "promotion":
        return <TagIcon className="h-5 w-5" />;
      case "system":
        return <ExclamationCircleIcon className="h-5 w-5" />;
      default:
        return <BellIcon className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order":
        return "text-blue-600 dark:text-blue-400";
      case "return":
        return "text-yellow-600 dark:text-yellow-400";
      case "refund":
        return "text-green-600 dark:text-green-400";
      case "promotion":
        return "text-purple-600 dark:text-purple-400";
      case "system":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "return":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "refund":
        return "bg-green-50 dark:bg-green-900/20";
      case "promotion":
        return "bg-purple-50 dark:bg-purple-900/20";
      case "system":
        return "bg-gray-50 dark:bg-gray-900";
      default:
        return "bg-gray-50 dark:bg-gray-900";
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
    setSelectedNotifications(selectedNotifications.filter((nId) => nId !== id));
    toast.success("Notification deleted");
  };

  const handleDeleteSelected = () => {
    if (selectedNotifications.length === 0) {
      toast.error("No notifications selected");
      return;
    }
    setNotifications(
      notifications.filter((notif) => !selectedNotifications.includes(notif.id))
    );
    setSelectedNotifications([]);
    toast.success(`${selectedNotifications.length} notification(s) deleted`);
  };

  const handleClearAll = () => {
    if (filteredNotifications.length === 0) {
      toast.error("No notifications to clear");
      return;
    }
    const idsToRemove = filteredNotifications.map((n) => n.id);
    setNotifications(
      notifications.filter((notif) => !idsToRemove.includes(notif.id))
    );
    setSelectedNotifications([]);
    toast.success("All notifications cleared");
  };

  const handleSelectNotification = (id: string) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(
        selectedNotifications.filter((nId) => nId !== id)
      );
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 dark:border-gray-800">
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
              Notifications
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex items-end justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  Stay Updated
                </p>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <div className="h-8 w-8 bg-gray-400 dark:bg-gray-600 text-white flex items-center justify-center">
                    <span className="text-xs font-medium">{unreadCount}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="border border-black dark:border-white text-black dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              Mark All Read
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex gap-0">
            <button
              onClick={() => setFilterType("all")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 ${
                filterType === "all"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType("order")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 ${
                filterType === "order"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Orders ({notifications.filter((n) => n.type === "order").length})
            </button>
            <button
              onClick={() => setFilterType("return")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 ${
                filterType === "return"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Returns ({notifications.filter((n) => n.type === "return").length}
              )
            </button>
            <button
              onClick={() => setFilterType("refund")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 ${
                filterType === "refund"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Refunds ({notifications.filter((n) => n.type === "refund").length}
              )
            </button>
            <button
              onClick={() => setFilterType("promotion")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 ${
                filterType === "promotion"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Promotions (
              {notifications.filter((n) => n.type === "promotion").length})
            </button>
            <button
              onClick={() => setFilterType("system")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 ${
                filterType === "system"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              System ({notifications.filter((n) => n.type === "system").length})
            </button>
          </div>
        </div>
      </section>

      {/* Actions Bar */}
      {filteredNotifications.length > 0 && (
        <section className="py-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-[0.2em]"
                >
                  {selectedNotifications.length === filteredNotifications.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                {selectedNotifications.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedNotifications.length} selected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {selectedNotifications.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="border border-gray-900 dark:border-white text-gray-900 dark:text-white px-6 h-9 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Delete Selected
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white px-6 h-9 uppercase tracking-[0.2em] text-[10px] font-medium hover:border-black dark:hover:border-white transition-colors flex items-center gap-2"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Notifications List */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-0 border border-gray-200 dark:border-gray-800">
              {filteredNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`relative group ${
                    index !== filteredNotifications.length - 1
                      ? "border-b border-gray-200 dark:border-gray-800"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-6 p-8 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleSelectNotification(notification.id)}
                      className="h-5 w-5 border-2 border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      {selectedNotifications.includes(notification.id) && (
                        <CheckIcon className="h-3 w-3 text-gray-900 dark:text-white" />
                      )}
                    </button>

                    {/* Unread Indicator - Grey Box */}
                    {!notification.read && (
                      <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 flex-shrink-0 mt-2" />
                    )}

                    {/* Icon */}
                    <div
                      className={`h-12 w-12 flex items-center justify-center flex-shrink-0 ${getNotificationBg(
                        notification.type
                      )}`}
                    >
                      <div className={getNotificationColor(notification.type)}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="flex-1 text-left"
                    >
                      <div className="space-y-2">
                        <h3
                          className={`text-sm ${
                            notification.read
                              ? "font-normal text-gray-600 dark:text-gray-400"
                              : "font-medium text-gray-900 dark:text-white"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p
                          className={`text-xs leading-relaxed ${
                            notification.read
                              ? "text-gray-500 dark:text-gray-500"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-600">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-8 w-8 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white flex items-center justify-center transition-colors"
                          title="Mark as read"
                        >
                          <CheckIcon className="h-3.5 w-3.5 text-gray-900 dark:text-white" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDeleteNotification(notification.id)
                        }
                        className="h-8 w-8 border border-gray-200 dark:border-gray-800 hover:border-gray-900 dark:hover:border-white flex items-center justify-center transition-colors group"
                        title="Delete"
                      >
                        <TrashIcon className="h-3.5 w-3.5 text-gray-900 dark:text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 border border-gray-200 dark:border-gray-800">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <BellIcon className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extralight text-gray-900 dark:text-white">
                    No Notifications
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You're all caught up! No new notifications to show.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
