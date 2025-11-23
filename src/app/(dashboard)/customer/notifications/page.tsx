/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
  ShoppingBagIcon,
  TagIcon,
  ExclamationCircleIcon,
  BellIcon,
  ArrowPathIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/use-page-title";
import { useNotifications } from "@/components/providers/notification-provider";
import { notificationApi } from "@/lib/api/notification.api";

type FilterType = "all" | "order" | "return" | "payment" | "system";

export default function NotificationsPage() {
  usePageTitle("Notifications");
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  // Filter notifications by category field (from database)
  const filteredNotifications = notifications.filter((notif) => {
    if (filterType === "all") return true;
    return notif.category === filterType;
  });

  const unreadFilteredCount = filteredNotifications.filter(
    (n) => !n.isRead
  ).length;

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";

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

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case "order":
        return <ShoppingBagIcon className="h-5 w-5" />;
      case "return":
        return <ArrowPathIcon className="h-5 w-5" />;
      case "payment":
        return <CubeIcon className="h-5 w-5" />;
      case "system":
        return <ExclamationCircleIcon className="h-5 w-5" />;
      default:
        return <BellIcon className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (category: string) => {
    switch (category) {
      case "order":
        return "text-blue-600 dark:text-blue-400";
      case "return":
        return "text-yellow-600 dark:text-yellow-400";
      case "payment":
        return "text-green-600 dark:text-green-400";
      case "system":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getNotificationBg = (category: string) => {
    switch (category) {
      case "order":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "return":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "payment":
        return "bg-green-50 dark:bg-green-900/20";
      case "system":
        return "bg-gray-50 dark:bg-gray-900";
      default:
        return "bg-gray-50 dark:bg-gray-900";
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await notificationApi.markAllAsRead();
      toast.success("All notifications marked as read");
      // Optionally refresh notifications here if you have a way to do so
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all notifications as read");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      setLoading(true);
      await notificationApi.deleteNotification(id);
      setSelectedNotifications(
        selectedNotifications.filter((nId) => nId !== id)
      );
      toast.success("Notification deleted");
      window.location.reload(); // Refresh to update the list
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) {
      toast.error("No notifications selected");
      return;
    }

    try {
      setLoading(true);
      await Promise.all(
        selectedNotifications.map((id) =>
          notificationApi.deleteNotification(id)
        )
      );
      setSelectedNotifications([]);
      toast.success(`${selectedNotifications.length} notification(s) deleted`);
      window.location.reload(); // Refresh to update the list
    } catch (error) {
      console.error("Failed to delete selected notifications:", error);
      toast.error("Failed to delete some notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (filteredNotifications.length === 0) {
      toast.error("No notifications to clear");
      return;
    }

    try {
      setLoading(true);
      const idsToRemove = filteredNotifications.map((n) => n._id);
      await Promise.all(
        idsToRemove.map((id) => notificationApi.deleteNotification(id))
      );
      setSelectedNotifications([]);
      toast.success("All notifications cleared");
      window.location.reload(); // Refresh to update the list
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
      toast.error("Failed to clear all notifications");
    } finally {
      setLoading(false);
    }
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
      setSelectedNotifications(filteredNotifications.map((n) => n._id));
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }

      // Priority 1: Use actionUrl if available
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
        return;
      }

      // Priority 2: Use action.url if available
      if (notification.action?.url) {
        router.push(notification.action.url);
        return;
      }

      // Priority 3: Smart routing based on notification type and related entity
      if (notification.relatedEntity) {
        const { entityType, entityId } = notification.relatedEntity;

        switch (entityType) {
          case "order":
            router.push(`/customer/orders/${entityId}`);
            break;
          case "return":
            router.push(`/customer/returns/${entityId}`);
            break;
          case "product":
            router.push(`/customer/products/${entityId}`);
            break;
          case "payment":
            router.push(`/customer/wallet`); // Wallet page for payments
            break;
          default:
            // Fallback based on notification category
            handleFallbackNavigation(notification.category);
        }
        return;
      }

      // Priority 4: Fallback based on notification category
      handleFallbackNavigation(notification.category);
    } catch (error) {
      console.error("Failed to handle notification click:", error);
    }
  };

  const handleFallbackNavigation = (category: string) => {
    switch (category) {
      case "order":
        router.push("/customer/orders");
        break;
      case "return":
        router.push("/customer/returns");
        break;
      case "payment":
        router.push("/customer/wallet");
        break;
      case "inventory":
        router.push("/customer/browse");
        break;
      case "product":
        router.push("/customer/browse");
        break;
      case "system":
        router.push("/customer/profile");
        break;
      default:
        router.push("/customer");
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
              disabled={unreadCount === 0 || loading}
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
          <div className="flex gap-0 overflow-x-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 whitespace-nowrap ${
                filterType === "all"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType("order")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 whitespace-nowrap ${
                filterType === "order"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Orders (
              {notifications.filter((n) => n.category === "order").length})
            </button>
            <button
              onClick={() => setFilterType("return")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 whitespace-nowrap ${
                filterType === "return"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Returns (
              {notifications.filter((n) => n.category === "return").length})
            </button>
            <button
              onClick={() => setFilterType("payment")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 whitespace-nowrap ${
                filterType === "payment"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Payments (
              {notifications.filter((n) => n.category === "payment").length})
            </button>
            <button
              onClick={() => setFilterType("system")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 whitespace-nowrap ${
                filterType === "system"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              System (
              {notifications.filter((n) => n.category === "system").length})
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
                  disabled={loading}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-[0.2em] disabled:opacity-50"
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
                    disabled={loading}
                    className="border border-gray-900 dark:border-white text-gray-900 dark:text-white px-6 h-9 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Delete Selected
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white px-6 h-9 uppercase tracking-[0.2em] text-[10px] font-medium hover:border-black dark:hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && notifications.length === 0 && (
        <section className="py-32">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center">
                <div className="h-8 w-8 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Loading notifications...
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Notifications List */}
      {!loading || notifications.length > 0 ? (
        <section className="py-16">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-0 border border-gray-200 dark:border-gray-800">
                {filteredNotifications.map((notification, index) => (
                  <div
                    key={notification._id}
                    className={`relative group ${
                      index !== filteredNotifications.length - 1
                        ? "border-b border-gray-200 dark:border-gray-800"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-6 p-8 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      {/* Checkbox */}
                      <button
                        onClick={() =>
                          handleSelectNotification(notification._id)
                        }
                        disabled={loading}
                        className="h-5 w-5 border-2 border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors flex items-center justify-center flex-shrink-0 mt-1 disabled:opacity-50"
                      >
                        {selectedNotifications.includes(notification._id) && (
                          <CheckIcon className="h-3 w-3 text-gray-900 dark:text-white" />
                        )}
                      </button>

                      {/* Unread Indicator - Grey Box */}
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 flex-shrink-0 mt-2" />
                      )}

                      {/* Icon */}
                      <div
                        className={`h-12 w-12 flex items-center justify-center flex-shrink-0 ${getNotificationBg(
                          notification.category
                        )}`}
                      >
                        <div
                          className={getNotificationColor(
                            notification.category
                          )}
                        >
                          {getNotificationIcon(notification.category)}
                        </div>
                      </div>

                      {/* Content */}
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        disabled={loading}
                        className="flex-1 text-left disabled:opacity-50"
                      >
                        <div className="space-y-2">
                          <h3
                            className={`text-sm ${
                              notification.isRead
                                ? "font-normal text-gray-600 dark:text-gray-400"
                                : "font-medium text-gray-900 dark:text-white"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <p
                            className={`text-xs leading-relaxed ${
                              notification.isRead
                                ? "text-gray-500 dark:text-gray-500"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {notification.shortMessage || notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-600">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            disabled={loading}
                            className="h-8 w-8 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Mark as read"
                          >
                            <CheckIcon className="h-3.5 w-3.5 text-gray-900 dark:text-white" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteNotification(notification._id)
                          }
                          disabled={loading}
                          className="h-8 w-8 border border-gray-200 dark:border-gray-800 hover:border-gray-900 dark:hover:border-white flex items-center justify-center transition-colors group disabled:opacity-50"
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
                      You&apos;re all caught up! No new notifications to show.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
