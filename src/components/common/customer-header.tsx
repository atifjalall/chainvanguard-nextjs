/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { useNotifications } from "@/components/providers/notification-provider";
import { useCart } from "@/components/providers/cart-provider";
import {
  BookmarkIcon,
  ShoppingCartIcon,
  BellIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSearch } from "@/hooks/use-search";
import { Product } from "@/types";

const APPAREL_CATEGORIES = {
  Men: {
    label: "MEN",
    images: [
      "/men/men1.png",
      "/men/men2.png",
      "/men/men3.png",
      "/men/men4.png",
    ],
    subcategories: [
      "BEST SELLERS",
      "NEW ARRIVALS",
      "T-SHIRTS",
      "SHIRTS",
      "HOODIES",
      "SWEATERS",
      "JACKETS",
      "COATS",
      "JEANS",
      "TROUSERS",
      "SHORTS",
      "SUITS",
      "KURTA",
      "SHALWAR KAMEEZ",
      "ACTIVEWEAR",
      "SLEEPWEAR",
      "SWIMWEAR",
      "UNDERWEAR",
    ],
  },
  Women: {
    label: "WOMEN",
    images: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop",
      "/women/women3.png",
      "/women/women1.png",
    ],
    subcategories: [
      "BEST SELLERS",
      "NEW ARRIVALS",
      "T-SHIRTS",
      "BLOUSES",
      "SHIRTS",
      "DRESSES",
      "SKIRTS",
      "JEANS",
      "TROUSERS",
      "SHORTS",
      "JACKETS",
      "COATS",
      "SWEATERS",
      "HOODIES",
      "SUITS",
      "JUMPSUITS",
      "SHALWAR KAMEEZ",
      "KURTA",
      "LAWN SUITS",
      "SAREES",
      "LEHENGA",
      "DUPATTA",
      "SHAWLS",
      "ACTIVEWEAR",
      "SLEEPWEAR",
      "SWIMWEAR",
      "UNDERWEAR",
    ],
  },
  Kids: {
    label: "KIDS",
    images: [
      "/kids/kids4.png",
      "/kids/kids2.png",
      "/kids/kids3.png",
      "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400&h=300&fit=crop",
    ],
    subcategories: [
      "BEST SELLERS",
      "NEW ARRIVALS",
      "T-SHIRTS",
      "SHIRTS",
      "SWEATERS",
      "HOODIES",
      "JEANS",
      "TROUSERS",
      "SHORTS",
      "DRESSES",
      "JACKETS",
      "COATS",
      "KURTA",
      "SHALWAR KAMEEZ",
      "ACTIVEWEAR",
      "SLEEPWEAR",
      "SWIMWEAR",
      "UNDERWEAR",
    ],
  },
  Unisex: {
    label: "UNISEX",
    images: [
      "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=300&fit=crop",
      "/unisex/uni2.webp",
      "https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=300&fit=crop",
    ],
    subcategories: [
      "BEST SELLERS",
      "NEW ARRIVALS",
      "T-SHIRTS",
      "HOODIES",
      "SWEATERS",
      "JACKETS",
      "ACTIVEWEAR",
      "SLEEPWEAR",
      "SWIMWEAR",
    ],
  },
};

export default function CustomerHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Men");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );

  const { user, logout } = useAuth();
  const { disconnectWallet } = useWallet();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { cartCount } = useCart();
  const {
    query,
    setQuery,
    suggestions,
    loading: searchLoading,
    clearSearch,
  } = useSearch();

  const searchRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when menu is open and prevent layout shift
  useEffect(() => {
    if (menuOpen) {
      // Get the scrollbar width
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // Prevent scrolling
      document.body.style.overflow = "hidden";

      // Add padding to prevent layout shift
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      // Re-enable scrolling
      document.body.style.overflow = "unset";

      // Remove padding
      document.body.style.paddingRight = "0px";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [menuOpen]);

  // Close notification and search dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Close notifications
      if (
        notificationOpen &&
        !target.closest(".notification-dropdown") &&
        !target.closest(".notification-button")
      ) {
        setNotificationOpen(false);
      }

      // Close search suggestions
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationOpen]);

  // Update selectedCategory and selectedSubcategory based on URL params
  useEffect(() => {
    if (!searchParams) return;
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    if (category) {
      setSelectedCategory(category.charAt(0).toUpperCase() + category.slice(1));
    }
    setSelectedSubcategory(subcategory);
  }, [searchParams]);

  const handleLogout = () => {
    disconnectWallet();
    logout();
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/customer/browse?search=${encodeURIComponent(query)}`);
      clearSearch();
      setSearchOpen(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSearchOpen(true);
  };

  const handleProductClick = (productId: string) => {
    if (!productId || productId === "undefined") {
      console.error("Invalid product ID");
      return;
    }
    router.push(`/customer/products/${productId}`);
    clearSearch();
    setSearchOpen(false);
  };

  const handleCategoryClick = (category: string, subcategory?: string) => {
    setMenuOpen(false);
    setSelectedSubcategory(subcategory?.toLowerCase() || null);
    if (subcategory) {
      router.push(
        `/customer/browse?category=${category.toLowerCase()}&subcategory=${subcategory.toLowerCase()}`
      );
    } else {
      router.push(`/customer/browse?category=${category.toLowerCase()}`);
    }
  };

  const handleMarkAsRead = async (
    notificationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }
      setNotificationOpen(false);

      // Navigate to action URL if available
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      } else if (notification.action?.url) {
        router.push(notification.action.url);
      }
    } catch (error) {
      console.error("Failed to handle notification click:", error);
    }
  };

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
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getDisplayName = () => {
    return user?.name || user?.walletName || "User";
  };

  return (
    <>
      {/* Hamburger Button - Always visible on top */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed top-2 left-12 lg:left-16 text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-all duration-300 w-12 h-12 z-[300]"
      >
        <div className="w-10 h-10 flex flex-col justify-center items-center">
          <span
            className={`block h-px w-10 bg-current absolute transition-all duration-300 ${
              menuOpen ? "rotate-45" : "-translate-y-2"
            }`}
          />
          <span
            className={`block h-px w-10 bg-current absolute transition-all duration-300 ${
              menuOpen ? "-rotate-45" : "translate-y-2"
            }`}
          />
        </div>
      </button>

      <header className="relative bg-white dark:bg-gray-950 sticky top-0 z-[250]">
        {/* Main Header */}
        <div className="flex h-16 items-center justify-between px-12 lg:px-16">
          {/* Left Section - Spacer for hamburger */}
          <div className="w-12" />

          {/* Center Section - Search */}
          <div className="hidden md:flex md:flex-none md:w-[640px] md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
            <div ref={searchRef} className="relative w-full">
              <form onSubmit={handleSearch}>
                <div className="flex items-center border-b border-gray-900 dark:border-white pb-px">
                  <input
                    type="search"
                    placeholder="Search products..."
                    value={query}
                    onChange={handleSearchInputChange}
                    className="w-full h-10 px-3 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </form>

              {/* Search Suggestions Dropdown */}
              {searchOpen && query.length >= 2 && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 z-50 max-h-96 overflow-y-auto">
                  {suggestions.map((product: Product) => (
                    <button
                      key={product._id || product.id}
                      onClick={() =>
                        handleProductClick(product._id || product.id)
                      }
                      className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 last:border-b-0"
                    >
                      {product.images?.[0] && (
                        <div className="w-12 h-12 relative shrink-0 bg-gray-100 dark:bg-gray-800">
                          <Image
                            src={
                              typeof product.images[0] === "string"
                                ? product.images[0]
                                : product.images[0].url
                            }
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-6">
            {/* Group icons together with a smaller gap */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  aria-label="Notifications"
                  className="notification-button h-10 w-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 relative transition-colors cursor-pointer"
                >
                  <BellIcon className="h-4 w-4 text-gray-900 dark:text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] flex items-center justify-center font-normal">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationOpen && (
                  <div className="notification-dropdown absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 z-50">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[480px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            No notifications yet
                          </p>
                        </div>
                      ) : (
                        notifications
                          .slice(0, 10)
                          .map((notification, index) => (
                            <div
                              key={notification._id}
                              className={`${
                                index !== Math.min(notifications.length, 10) - 1
                                  ? "border-b border-gray-200 dark:border-gray-800"
                                  : ""
                              }`}
                            >
                              <button
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                                className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left group"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Unread Indicator - Grey Square */}
                                  {!notification.isRead && (
                                    <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 shrink-0 mt-1" />
                                  )}

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <h4
                                      className={`text-xs mb-1 ${
                                        notification.isRead
                                          ? "font-normal text-gray-600 dark:text-gray-400"
                                          : "font-medium text-gray-900 dark:text-white"
                                      }`}
                                    >
                                      {notification.title}
                                    </h4>
                                    <p
                                      className={`text-xs mb-1 line-clamp-2 ${
                                        notification.isRead
                                          ? "text-gray-500 dark:text-gray-500"
                                          : "text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      {notification.shortMessage ||
                                        notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-600">
                                      {formatTime(notification.createdAt)}
                                    </p>
                                  </div>

                                  {/* Mark as Read Button */}
                                  {!notification.isRead && (
                                    <div
                                      onClick={(e) =>
                                        handleMarkAsRead(notification._id, e)
                                      }
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" ||
                                          e.key === " "
                                        ) {
                                          handleMarkAsRead(
                                            notification._id,
                                            e as any
                                          );
                                        }
                                      }}
                                      className="h-6 w-6 border border-gray-200 dark:border-gray-800 hover:border-gray-900 dark:hover:border-white flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      title="Mark as read"
                                    >
                                      <CheckIcon className="h-3 w-3 text-gray-900 dark:text-white" />
                                    </div>
                                  )}
                                </div>
                              </button>
                            </div>
                          ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                      <button
                        onClick={() => {
                          setNotificationOpen(false);
                          router.push("/customer/notifications");
                        }}
                        className="w-full text-center text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                      >
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <button
                onClick={() => router.push("/customer/saved-items")}
                aria-label="Saved items"
                className="h-10 w-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
              >
                <BookmarkIcon className="h-4 w-4 text-gray-900 dark:text-white" />
              </button>

              {/* Cart */}
              <button
                onClick={() => router.push("/customer/cart")}
                aria-label="Cart"
                className="h-10 w-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 relative transition-colors cursor-pointer"
              >
                <ShoppingCartIcon className="h-4 w-4 text-gray-900 dark:text-white" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] flex items-center justify-center font-normal">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Info Section */}
            <div className="flex items-center gap-6 pl-6 border-l border-gray-200 dark:border-gray-800">
              {/* User Name - clickable */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/customer/profile");
                }}
                aria-label="Profile"
                className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium hidden sm:block cursor-pointer text-left"
              >
                {getDisplayName()}
              </button>

              {/* Wallet Button */}
              <button
                onClick={() => router.push("/customer/wallet")}
                className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-pointer"
              >
                Wallet
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-12 py-3 border-t border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSearch}>
            <div className="flex items-center border-b border-gray-900 dark:border-white pb-px">
              <input
                type="search"
                placeholder="Search products..."
                value={query}
                onChange={handleSearchInputChange}
                className="flex-1 h-10 px-3 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              />
              {searchLoading && (
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin mr-3" />
              )}
            </div>
          </form>
        </div>
      </header>

      {/* Sidebar Menu with Framer Motion */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop - Minimal white balance (85% opacity) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="fixed inset-0 bg-white/85 dark:bg-black/85 z-[260]"
              onClick={() => setMenuOpen(false)}
            />

            {/* Sidebar - Hidden scrollbar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 h-full w-full md:w-1/2 bg-white dark:bg-gray-950 z-[270] overflow-y-auto scrollbar-hide"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="flex flex-col h-full">
                {/* Sidebar Header - Logo moved down */}
                <div className="flex items-center px-12 lg:px-16 py-12 border-b border-gray-200 dark:border-gray-800">
                  <Link
                    href="/customer"
                    className="flex items-center ml-32"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="text-3xl lg:text-4xl font-thin text-gray-900 dark:text-white tracking-wide">
                      ChainVanguard
                    </span>
                  </Link>
                </div>

                {/* Categories Grid */}
                <div className="flex-1 px-12 lg:px-16 py-8">
                  <div className="grid grid-cols-[200px_1fr] gap-16">
                    {/* Left Column - Main Categories */}
                    <div className="space-y-3">
                      {Object.entries(APPAREL_CATEGORIES).map(
                        ([key, category]) => (
                          <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`text-left text-[10px] uppercase tracking-[0.2em] py-1 transition-all duration-200 block ${
                              selectedCategory === key
                                ? "text-gray-900 dark:text-white font-semibold"
                                : "text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            }`}
                          >
                            {category.label}
                          </button>
                        )
                      )}

                      {/* Additional Links */}
                      <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            router.push("/customer/browse?category=men&subcategory=best%20sellers");
                          }}
                          className="text-left text-[10px] uppercase tracking-[0.2em] py-1 text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors block"
                        >
                          SALE
                        </button>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            router.push("/customer/browse?sort=newest");
                          }}
                          className="text-left text-[10px] uppercase tracking-[0.2em] py-1 text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors block"
                        >
                          NEW ARRIVALS
                        </button>
                      </div>
                    </div>

                    {/* Right Column - Multiple Images and Subcategories */}
                    <div className="space-y-6">
                      {/* Multiple Fashion Images Grid - Different for each category */}
                      <div className="grid grid-cols-4 gap-2">
                        {APPAREL_CATEGORIES[
                          selectedCategory as keyof typeof APPAREL_CATEGORIES
                        ]?.images.map((image, index) => (
                          <div
                            key={index}
                            className="relative w-full h-32 overflow-hidden"
                          >
                            <Image
                              src={image}
                              alt={`${selectedCategory} ${index + 1}`}
                              fill
                              className="object-cover"
                              priority
                            />
                          </div>
                        ))}
                      </div>

                      {/* Subcategories */}
                      <div className="space-y-3">
                        {APPAREL_CATEGORIES[
                          selectedCategory as keyof typeof APPAREL_CATEGORIES
                        ]?.subcategories.map((subcat) => (
                          <button
                            key={subcat}
                            onClick={() =>
                              handleCategoryClick(selectedCategory, subcat)
                            }
                            className={`text-left text-[10px] uppercase tracking-[0.2em] py-1 transition-colors block ${
                              selectedSubcategory === subcat.toLowerCase()
                                ? "text-gray-900 dark:text-white font-semibold"
                                : "text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            }`}
                          >
                            {subcat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
