"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CubeIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserIcon,
  WalletIcon,
  BookmarkIcon,
  BellIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";

const APPAREL_CATEGORIES = {
  Men: {
    label: "Men",
    subcategories: [
      "T-Shirts",
      "Shirts",
      "Hoodies",
      "Sweaters",
      "Jackets",
      "Coats",
      "Jeans",
      "Trousers",
      "Shorts",
      "Suits",
      "Activewear",
      "Sleepwear",
      "Underwear",
    ],
  },
  Women: {
    label: "Women",
    subcategories: [
      "T-Shirts",
      "Blouses",
      "Shirts",
      "Dresses",
      "Skirts",
      "Jeans",
      "Trousers",
      "Shorts",
      "Jackets",
      "Coats",
      "Sweaters",
      "Hoodies",
      "Suits",
      "Jumpsuits",
      "Activewear",
      "Sleepwear",
      "Swimwear",
      "Underwear",
    ],
  },
  Kids: {
    label: "Kids",
    subcategories: [
      "T-Shirts",
      "Shirts",
      "Sweaters",
      "Hoodies",
      "Jeans",
      "Trousers",
      "Shorts",
      "Dresses",
      "Jackets",
      "Coats",
      "Activewear",
      "Sleepwear",
      "Underwear",
    ],
  },
  Accessories: {
    label: "Accessories",
    subcategories: [
      "Bags",
      "Wallets",
      "Belts",
      "Hats",
      "Scarves",
      "Sunglasses",
      "Watches",
      "Jewelry",
    ],
  },
};

export default function CustomerHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const { user, logout } = useAuth();
  const { currentWallet, balance, disconnectWallet } = useWallet();

  const handleLogout = () => {
    disconnectWallet();
    logout();
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/customer/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (category: string, subcategory?: string) => {
    setOpenCategory(null);
    if (subcategory) {
      router.push(
        `/customer/products?category=${category}&subcategory=${subcategory}`
      );
    } else {
      router.push(`/customer/products?category=${category}`);
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

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-[100]">
      {/* Top Bar */}
      <div className="flex h-16 items-center justify-between px-6 gap-8">
        {/* Logo */}
        {/* Logo on the far left */}
        <Link
          href="/"
          className="flex items-center space-x-3 group cursor-pointer"
        >
          <Package className="h-6 w-6 text-gray-900 dark:text-white" />
          <span className="text-xl font-light text-gray-900 dark:text-white">
            ChainVanguard
          </span>
        </Link>
        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-11 bg-transparent border border-gray-200 dark:border-gray-800 focus-visible:ring-0 focus-visible:border-gray-900 dark:focus-visible:border-white transition-colors rounded-none"
            />
          </form>
        </div>
        {/* Right Actions */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-none cursor-pointer"
          >
            <BellIcon className="h-5 w-5 text-gray-900 dark:text-white" />
          </Button>

          {/* Wishlist */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-none cursor-pointer"
            onClick={() => router.push("/customer/wishlist")}
          >
            <BookmarkIcon className="h-5 w-5 text-gray-900 dark:text-white" />
          </Button>

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-gray-50 dark:hover:bg-gray-900 relative rounded-none cursor-pointer"
            onClick={() => router.push("/customer/cart")}
          >
            <ShoppingCartIcon className="h-5 w-5 text-gray-900 dark:text-white" />
            <span className="absolute top-1 right-1 h-4 w-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] flex items-center justify-center font-medium">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 ml-2 cursor-pointer"
              >
                <Avatar className="h-8 w-8 rounded-none">
                  <AvatarFallback className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-none">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-64 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-none"
              align="end"
              forceMount
              sideOffset={8}
              style={{ zIndex: 150 }}
            >
              <DropdownMenuLabel className="font-normal py-3">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs w-fit py-0.5 px-2 border-gray-200 dark:border-gray-800 rounded-none"
                  >
                    Customer
                  </Badge>
                </div>
              </DropdownMenuLabel>

              {currentWallet && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="font-normal py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Wallet
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentWallet.name}
                      </p>
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {formatAddress(currentWallet.address)}
                      </p>
                      <p className="text-xs text-gray-900 dark:text-white">
                        Balance: ${balance}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm py-2 rounded-none">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm py-2 rounded-none"
                onClick={() => router.push("/customer/orders")}
              >
                <ShoppingCartIcon className="mr-2 h-4 w-4" />
                <span>My Orders</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm py-2 rounded-none">
                <WalletIcon className="mr-2 h-4 w-4" />
                <span>Wallet</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm py-2 rounded-none">
                <Cog6ToothIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-sm py-2 text-gray-900 dark:text-white rounded-none"
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div
          className="flex items-center gap-0 px-6 h-12 overflow-x-auto scrollbar-hide"
          onMouseLeave={() => setOpenCategory(null)}
        >
          {/* Category Links */}
          {Object.entries(APPAREL_CATEGORIES).map(([key, category]) => (
            <DropdownMenu
              key={key}
              open={openCategory === key}
              onOpenChange={(open) => setOpenCategory(open ? key : null)}
            >
              <DropdownMenuTrigger asChild>
                <button
                  onMouseEnter={() => setOpenCategory(key)}
                  className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap focus-visible:outline-none cursor-pointer"
                >
                  {category.label}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-80 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-none p-0"
                align="start"
                sideOffset={0}
                style={{ zIndex: 150 }}
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Browse all {category.label.toLowerCase()} products
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-0 p-4">
                  {category.subcategories.map((subcat) => (
                    <button
                      key={subcat}
                      onClick={() => handleCategoryClick(key, subcat)}
                      className="text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors rounded-none cursor-pointer"
                    >
                      {subcat}
                    </button>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                  <button
                    onClick={() => handleCategoryClick(key)}
                    className="w-full px-4 py-2 text-sm font-medium bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 transition-colors rounded-none cursor-pointer"
                  >
                    View All {category.label}
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}

          {/* Sale Link */}
          <button
            onClick={() => router.push("/customer/deals")}
            className="px-6 py-3 text-sm text-gray-900 dark:text-white font-medium whitespace-nowrap transition-colors ml-auto"
          >
            Sale
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-800 px-6 py-3">
        <form onSubmit={handleSearch} className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 h-11 bg-transparent border border-gray-200 dark:border-gray-800 focus-visible:ring-0 focus-visible:border-gray-900 dark:focus-visible:border-white transition-colors rounded-none"
          />
        </form>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </header>
  );
}
