"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Package, LogOut, Settings, User, Wallet, X, Menu } from "lucide-react";
import { Heart, Bell, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { currentWallet, balance, disconnectWallet } = useWallet();
  const router = useRouter();

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
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "vendor":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "customer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "blockchain-expert":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
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

  return (
    <header className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center">
              <Package className="h-4 w-4 text-white cursor-pointer" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ChainVanguard
            </span>
          </div>

          {user?.role && (
            <Badge
              variant="outline"
              className={`ml-2 ${getRoleColor(user.role)}`}
            >
              {getRoleDisplayName(user.role)}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Wallet Info */}
          {currentWallet && (
            <div className="hidden md:flex items-center space-x-1 px-2 py-0.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
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

          {/* Notifications (Everyone sees this) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 cursor-pointer"
          >
            <Bell className="h-4 w-4 cursor-pointer" />
          </Button>

          {/* Wishlist (Only CUSTOMER) */}
          {(isCustomer || isVendor) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 cursor-pointer"
              onClick={() => router.push("/vendor/wishlist")}
            >
              <Heart className="h-4 w-4 cursor-pointer" />
            </Button>
          )}

          {/* Cart (Vendor & Customer → Yes | Supplier → No) */}
          {(isVendor || isCustomer) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 cursor-pointer"
              onClick={() => router.push("/vendor/cart")}
            >
              <ShoppingCart className="h-4 w-4 cursor-pointer" />
            </Button>
          )}

          {/* User Menu */}
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
                  <Badge
                    variant="outline"
                    className={`text-[10px] w-fit py-0 px-1.5 ${getRoleColor(user?.role)}`}
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
                        Balance: ${balance}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs py-1 h-7 cursor-pointer">
                <User className="mr-2 h-3.5 w-3.5" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs py-1 h-7 cursor-pointer">
                <Wallet className="mr-2 h-3.5 w-3.5" />
                <span>Wallet</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs py-1 h-7 cursor-pointer">
                <Settings className="mr-2 h-3.5 w-3.5" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-xs py-1 h-7 cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                <span>Disconnect & Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
