"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { Button } from "@/components/_ui/button";
import { Avatar, AvatarFallback } from "@/components/_ui/avatar";
import { Input } from "@/components/_ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/_ui/dropdown-menu";
import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  Package,
  LogOut,
  Settings,
  User,
  Wallet,
  Search,
  ChevronDown,
  Heart,
  ShoppingCart,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { APPAREL_CATEGORIES } from "@/config/apparel-categories";
import { useState } from "react";

export function CustomerHeader() {
  const { user, logout } = useAuth();
  const { currentWallet, balance, disconnectWallet } = useWallet();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const isGuest = !user;

  const handleLogout = () => {
    disconnectWallet();
    logout();
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
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
    <header className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
      <div className="flex h-14 items-center justify-between px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center">
            <Package className="h-4 w-4 text-white cursor-pointer" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ChainVanguard
          </span>
        </div>

        {/* Categories Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 px-3 text-sm font-medium hover:bg-gray-100/50 dark:hover:bg-gray-800/50 cursor-pointer"
            >
              Categories
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50"
            align="start"
          >
            {Object.entries(APPAREL_CATEGORIES).map(([key, category]) => (
              <DropdownMenuSub key={key}>
                <DropdownMenuSubTrigger className="text-sm py-1.5 cursor-pointer">
                  {category.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
                  {category.subcategories.map((subcat) => (
                    <DropdownMenuItem
                      key={subcat}
                      className="text-sm py-1.5 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/products?category=${key}&subcat=${subcat}`
                        )
                      }
                    >
                      {subcat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-xl hidden md:flex"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-10 pr-4 bg-gray-100/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 focus:bg-white dark:focus:bg-gray-900 transition-colors"
            />
          </div>
        </form>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Wallet Info (Only for logged-in customers) */}
          {currentWallet && !isGuest && (
            <div className="hidden lg:flex items-center space-x-1 px-2 py-0.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
              <Wallet className="h-3 w-3 text-gray-600 dark:text-gray-400 cursor-pointer" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                ${balance}
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

          {/* Wishlist */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 cursor-pointer"
            onClick={() => router.push("/wishlist")}
          >
            <Heart className="h-4 w-4 cursor-pointer" />
          </Button>

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 cursor-pointer"
            onClick={() => router.push("/cart")}
          >
            <ShoppingCart className="h-4 w-4 cursor-pointer" />
          </Button>

          {/* User Menu or Login Button */}
          {isGuest ? (
            <Button
              onClick={() => router.push("/login")}
              className="h-8 px-4 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              Sign In
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-56 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal py-2">
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="bg-blue-600 text-white text-[10px]">
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
                          Balance: ${balance}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs py-1 h-7 cursor-pointer"
                  onClick={() => router.push("/profile")}
                >
                  <User className="mr-2 h-3.5 w-3.5" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs py-1 h-7 cursor-pointer"
                  onClick={() => router.push("/orders")}
                >
                  <Package className="mr-2 h-3.5 w-3.5" />
                  <span>My Orders</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs py-1 h-7 cursor-pointer"
                  onClick={() => router.push("/wishlist")}
                >
                  <Heart className="mr-2 h-3.5 w-3.5" />
                  <span>My Wishlist</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs py-1 h-7 cursor-pointer"
                  onClick={() => router.push("/wallet")}
                >
                  <Wallet className="mr-2 h-3.5 w-3.5" />
                  <span>Wallet</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs py-1 h-7 cursor-pointer"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-xs py-1 h-7 cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
