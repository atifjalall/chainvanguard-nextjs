/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { Button } from "@/components/_ui/button";
import { Avatar, AvatarFallback } from "@/components/_ui/avatar";
import { Badge } from "@/components/_ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  CubeIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserIcon,
  WalletIcon,
  HeartIcon,
  BellIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  InboxArrowDownIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/components/common/dashboard-sidebar";
import { useState, useEffect, useRef } from "react";
import { colors } from "@/lib/colorConstants";
import { notificationApi, Notification } from "@/lib/api/notification.api";

export function DashboardHeader({
  onMarkAllAsRead,
}: {
  onMarkAllAsRead?: () => void;
} = {}) {
  const { user, logout } = useAuth();
  const { currentWallet, balance, disconnectWallet } = useWallet();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = async () => {
    try {
      console.log("🔔 Fetching notifications...");
      setLoading(true);
      const response = await notificationApi.getNotifications();
      console.log("✅ Notifications response:", response);

      // Backend returns: { success: true, data: { notifications: [], unreadCount: 0, pagination: {} } }
      // But apiClient.get returns response.data, so we get: { notifications: [], unreadCount: 0, pagination: {} }
      const notifs = response.notifications || [];
      const unread = response.unreadCount || 0;

      console.log("📋 Notifications count:", notifs.length);
      console.log("🔢 Unread count:", unread);
      console.log("📝 Notifications data:", notifs);

      setNotifications(notifs);
      setUnreadCount(unread);
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
      // Show error details for debugging
      const error = err as any;
      if (error?.response) {
        console.error("📡 Response error data:", error.response.data);
        console.error("📡 Response status:", error.response.status);
      }
      if (error?.message) {
        console.error("💬 Error message:", error.message);
      }
    } finally {
      setLoading(false);
      console.log("✔️ Fetch notifications complete");
    }
  };

  useEffect(() => {
    if (user) {
      console.log("👤 User detected, fetching notifications for:", user);
      fetchNotifications();

      // Poll for new notifications every 30 seconds
      console.log("⏰ Setting up notification polling (30s interval)");
      const interval = setInterval(() => {
        console.log("🔄 Polling for new notifications...");
        fetchNotifications();
      }, 30000);

      return () => {
        console.log("🛑 Clearing notification polling interval");
        clearInterval(interval);
      };
    } else {
      console.log("⚠️ No user found, skipping notification fetch");
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      console.log("🖱️ Notification clicked:", notification);

      // Check isRead field (backend uses isRead, not read)
      if (!notification.isRead) {
        console.log("📬 Marking notification as read:", notification._id);
        await notificationApi.markAsRead(notification._id);
        await fetchNotifications();
      } else {
        console.log("✅ Notification already read");
      }

      // Close notification dropdown
      setShowNotifications(false);

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
        // Get request number from notification
        const requestNumber =
          notification.relatedEntity?.entityData?.requestNumber ||
          notification.metadata?.requestNumber ||
          notification.message.match(/REQ-\d+-\d+/)?.[0] ||
          "";

        // Route based on user role
        const requestsPage =
          user?.role === "vendor"
            ? "/vendor/my-requests"
            : "/supplier/vendor-requests";

        console.log(
          "🚀 Navigating to vendor requests page:",
          requestsPage,
          "Search:",
          requestNumber
        );

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

        // If order is completed/delivered, go to transactions
        if (
          notification.type === "order_completed" ||
          notification.type === "order_delivered"
        ) {
          console.log("🚀 Navigating to transactions page for completed order");
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

        // For other order notifications, go to orders page
        console.log("🚀 Navigating to orders page");
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
        console.log("🚀 Navigating to wallet page");
        window.location.href = "/wallet";
        return;
      }

      // ========================================
      // USE DYNAMIC actionUrl FROM BACKEND IF AVAILABLE
      // ========================================
      if (notification.action?.url) {
        console.log("🚀 Navigating to action.url:", notification.action.url);
        window.location.href = notification.action.url;
        return;
      }

      if (notification.actionUrl) {
        console.log("🚀 Navigating to actionUrl:", notification.actionUrl);
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
      console.log("🚀 Navigating to fallback route:", route);
      window.location.href = route;
    } catch (err) {
      console.error("❌ Error handling notification click:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log("📬 Marking all notifications as read...");
      await notificationApi.markAllAsRead();
      console.log("✅ All notifications marked as read");
      await fetchNotifications();
      if (onMarkAllAsRead) onMarkAllAsRead(); // Notify parent
    } catch (err) {
      console.error("❌ Error marking all as read:", err);
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

  const handleLogout = () => {
    disconnectWallet();
    logout();
    router.push("/login");
  };

  const isSupplier = user?.role === "supplier";
  const isVendor = user?.role === "vendor";
  const isCustomer = user?.role === "customer";
  const isBlockchainExpert = user?.role === "expert";

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "supplier":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "vendor":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "customer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "blockchain-expert":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case "blockchain-expert":
        return "BLOCKCHAIN EXPERT";
      case "supplier":
        return "SUPPLIER";
      case "vendor":
        return "VENDOR";
      case "customer":
        return "CUSTOMER";
      default:
        return "USER";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }

    if (user?.walletName) {
      return user.walletName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }

    return "U";
  };

  const getDisplayName = () => {
    return user?.name || user?.walletName || "User";
  };

  // Listen for markAllAsRead event from notifications page
  useEffect(() => {
    const handler = async () => {
      await fetchNotifications();
    };
    window.addEventListener("notifications:markAllAsRead", handler);
    return () =>
      window.removeEventListener("notifications:markAllAsRead", handler);
  }, []);

  return (
    <header
      className={`${colors.backgrounds.secondary} border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50`}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          {/* Add collapse button next to logo, visible only on desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-4.5 w-4.5 text-gray-700 dark:text-gray-300"
            >
              {/* Outer rectangle with path-based rounded corners */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7.25A2.25 2.25 0 0 1 5.25 5h13.5A2.25 2.25 0 0 1 21 7.25v9.5A2.25 2.25 0 0 1 18.75 19H5.25A2.25 2.25 0 0 1 3 16.75v-9.5Z"
              />
              {/* Vertical divider line */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5v14" />
              {/* Two horizontal lines in sidebar section */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 9h2M5 12h2"
              />
            </svg>
          </Button>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ChainVanguard
            </span>
          </div>

          {user?.role && (
            <Badge
              variant="outline"
              className={`ml-2 bg-transparent border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-none`}
            >
              {getRoleDisplayName(user.role)}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Wallet Info */}
          {currentWallet && (
            <div className="hidden md:flex items-center space-x-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 backdrop-blur-sm rounded-none">
              <WalletIcon className="h-3 w-3 text-gray-600 dark:text-gray-400 cursor-pointer" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Rs {balance}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatAddress(currentWallet.address)}
              </span>
            </div>
          )}

          {/* Theme Toggle */}
          <div className="cursor-pointer">
            <ThemeToggle />
          </div>

          {/* Notifications (Everyone sees this) */}
          <div className="relative">
            <Button
              ref={buttonRef}
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-none relative"
            >
              <BellIcon className="h-4 w-4 cursor-pointer" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-black text-white text-xs flex items-center justify-center rounded-none font-semibold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            {showNotifications && (
              <div
                ref={dropdownRef}
                className="absolute top-10 right-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-none shadow-lg z-50 w-80"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-6 px-2 rounded-none"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="p-2 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100 rounded-full" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <BellIcon className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    [...notifications]
                      .sort((a, b) => {
                        if (a.isRead === b.isRead) {
                          return (
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                          );
                        }
                        return a.isRead ? 1 : -1; // unread first
                      })
                      .map((notif) => {
                        const IconComponent = getNotificationIcon(notif.type);
                        return (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`flex items-start p-3 mb-2 rounded-none cursor-pointer transition-colors ${
                              !notif.isRead
                                ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <IconComponent className="h-4 w-4 mr-3 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              {notif.title && (
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                                  {notif.title}
                                </p>
                              )}
                              <p className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                                {notif.message}
                              </p>
                              <div className="flex items-center mt-1">
                                <ClockIcon className="h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {getTimeAgo(notif.createdAt)}
                                </span>
                              </div>
                            </div>
                            {!notif.isRead && (
                              <div className="ml-2 h-2 w-2 bg-gray-500 rounded-none flex-shrink-0" />
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                    <Button
                      variant="ghost"
                      className="w-full text-xs rounded-none"
                      onClick={() => {
                        setShowNotifications(false);
                        router.push("/notifications");
                      }}
                    >
                      View all notifications
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wishlist (Only CUSTOMER) */}
          {(isCustomer || isVendor) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-none"
              onClick={() => router.push("/vendor/wishlist")}
            >
              <HeartIcon className="h-4 w-4 cursor-pointer" />
            </Button>
          )}

          {/* Cart (Vendor & Customer → Yes | Supplier → No) */}
          {(isVendor || isCustomer) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-none"
              onClick={() => router.push("/vendor/cart")}
            >
              <ShoppingCartIcon className="h-4 w-4 cursor-pointer" />
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-none"
              >
                <Avatar className="h-8 w-8 rounded-none">
                  <AvatarFallback className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-none">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-56 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 rounded-none"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal py-2">
                <div className="flex flex-col space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-4 w-4 rounded-none">
                      <AvatarFallback className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] rounded-none">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium leading-none text-gray-900 dark:text-gray-100">
                      {getDisplayName()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {user?.email}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] w-fit py-0 px-1.5 bg-transparent border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-none`}
                  >
                    {getRoleDisplayName(user?.role)}
                  </Badge>
                </div>
              </DropdownMenuLabel>

              {currentWallet && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="font-normal py-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        Wallet
                      </p>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {currentWallet.name}
                      </p>
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {formatAddress(currentWallet.address)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Balance: Rs {balance}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs py-1 h-7 cursor-pointer rounded-none">
                <UserIcon className="mr-2 h-3.5 w-3.5" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs py-1 h-7 cursor-pointer rounded-none">
                <WalletIcon className="mr-2 h-3.5 w-3.5" />
                <span>Wallet</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs py-1 h-7 cursor-pointer rounded-none">
                <Cog6ToothIcon className="mr-2 h-3.5 w-3.5" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-xs py-1 h-7 cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none"
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-3.5 w-3.5" />
                <span>Disconnect & Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
