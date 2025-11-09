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
  XMarkIcon,
  Bars3Icon,
  HeartIcon,
  BellIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/components/common/dashboard-sidebar";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { currentWallet, balance, disconnectWallet } = useWallet();
  const { isCollapsed, setIsCollapsed } = useSidebar();
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

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
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
            className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-none"
          >
            <BellIcon className="h-4 w-4 cursor-pointer" />
          </Button>

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
                        Balance: ${balance}
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
