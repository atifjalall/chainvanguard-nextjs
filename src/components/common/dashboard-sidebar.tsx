"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  HomeIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon,
  PlusIcon,
  ClockIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ListBulletIcon,
  ShieldCheckIcon,
  BoltIcon,
  ComputerDesktopIcon,
  CodeBracketSquareIcon,
  Bars3Icon,
  XMarkIcon,
  WalletIcon,
  CheckBadgeIcon,
  ArchiveBoxIcon,
  CreditCardIcon,
  InboxIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ReceiptRefundIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, createContext, useContext } from "react";

// Create context for sidebar state
const SidebarContext = createContext<{
  isCollapsed: boolean;
  isMobile: boolean;
  isOpen: boolean;
  setIsCollapsed: (value: boolean) => void;
  setIsOpen: (value: boolean) => void;
}>({
  isCollapsed: false,
  isMobile: false,
  isOpen: false,
  setIsCollapsed: () => {},
  setIsOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

// Export the provider component
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, isMobile, isOpen, setIsCollapsed, setIsOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function DashboardSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { isOpen, isMobile, isCollapsed, setIsOpen, setIsCollapsed } =
    useSidebar();

  // Close sidebar when route changes
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  }, [pathname]);

  const getNavigationItems = () => {
    switch (user?.role) {
      // 1. Supplier
      case "supplier":
        return [
          { href: "/supplier", label: "Dashboard", icon: HomeIcon },
          {
            href: "/supplier/add-inventory",
            label: "Add Inventory",
            icon: PlusIcon,
          },
          {
            href: "/supplier/inventory",
            label: "Inventory",
            icon: BuildingStorefrontIcon,
          },

          {
            href: "/supplier/vendor-requests",
            label: "Vendor Requests",
            icon: InboxIcon,
          },
          {
            href: "/supplier/transactions",
            label: "Transactions",
            icon: CreditCardIcon,
          },
          { href: "/supplier/vendors", label: "Vendors", icon: UsersIcon },
          { href: "/supplier/insights", label: "Insights", icon: ChartBarIcon },
          { href: "/wallet", label: "Wallet", icon: WalletIcon },
        ];

      // 2. Vendor
      case "vendor":
        return [
          { href: "/vendor", label: "Dashboard", icon: HomeIcon },
          {
            href: "/vendor/browse",
            label: "Browse Inventory",
            icon: MagnifyingGlassIcon,
          },
          {
            href: "/vendor/my-inventory",
            label: "My Inventory",
            icon: BuildingStorefrontIcon,
          },
          {
            href: "/vendor/my-requests",
            label: "My Requests",
            icon: InboxIcon,
          },
          {
            href: "/vendor/transactions",
            label: "Transactions",
            icon: CreditCardIcon,
          },
          {
            href: "/vendor/add-product",
            label: "Add Product",
            icon: PlusIcon,
          },
          {
            href: "/vendor/my-products",
            label: "My Products",
            icon: CubeIcon,
          },
          {
            href: "/vendor/orders",
            label: "Orders",
            icon: ClipboardDocumentListIcon,
          },
          {
            href: "/vendor/returns",
            label: "Returns",
            icon: ReceiptRefundIcon,
          },
          { href: "/vendor/customers", label: "Customers", icon: UsersIcon },
          {
            href: "/vendor/insights",
            label: "Insights",
            icon: ArrowTrendingUpIcon,
          },
          { href: "/wallet", label: "Wallet", icon: WalletIcon },
        ];

      // Customer - No sidebar (uses e-commerce header instead)
      case "customer":
        return [];

      // 3. Blockchain Expert
      case "expert":
        return [
          { href: "/blockchain-expert", label: "Dashboard", icon: HomeIcon },
          {
            href: "/blockchain-expert/all-transactions",
            label: "All Transactions",
            icon: ListBulletIcon,
          },
          {
            href: "/blockchain-expert/blockchain-logs",
            label: "Blockchain Logs",
            icon: DocumentTextIcon,
          },
          {
            href: "/blockchain-expert/consensus",
            label: "Consensus",
            icon: CodeBracketSquareIcon,
          },
          {
            href: "/blockchain-expert/security",
            label: "Security",
            icon: ShieldCheckIcon,
          },
          {
            href: "/blockchain-expert/fault-tolerance",
            label: "Fault Tolerance",
            icon: BoltIcon,
          },
          {
            href: "/blockchain-expert/system-health",
            label: "System Health",
            icon: ComputerDesktopIcon,
          },
          { href: "/wallet", label: "Wallet", icon: WalletIcon },
        ];

      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  // Don't render sidebar for customers (they use e-commerce header)
  if (user?.role === "customer" || navigationItems.length === 0) {
    return null;
  }

  // Mobile toggle button
  const MobileToggle = () => (
    <div className="md:hidden fixed top-4 left-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 bg-white dark:bg-gray-900 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-md rounded-none"
      >
        {isOpen ? (
          <XMarkIcon className="h-5 w-5" />
        ) : (
          <Bars3Icon className="h-5 w-5" />
        )}
      </Button>
    </div>
  );

  // Overlay for mobile when sidebar is open
  const Overlay = () => (
    <div
      className={cn(
        "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={() => setIsOpen(false)}
    />
  );

  return (
    <>
      <MobileToggle />
      <Overlay />

      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ease-in-out",
          isMobile
            ? isOpen
              ? "w-64 translate-x-0"
              : "-translate-x-full"
            : isCollapsed
              ? "w-16"
              : "w-64"
        )}
      >
        <div className="h-full pt-12 pb-6 overflow-y-auto">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-4 px-4">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 md:hidden"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 rounded-none",
                      isActive &&
                        "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900",
                      "justify-start"
                    )}
                    asChild
                    title={isCollapsed && !isMobile ? item.label : undefined}
                  >
                    <Link href={item.href} className="flex items-center">
                      <Icon className={cn("h-4 w-4 flex-shrink-0", "mr-3")} />
                      <span
                        className={cn(
                          "transition-all duration-300 ease-in-out whitespace-nowrap",
                          isCollapsed && !isMobile
                            ? "opacity-0 w-0 overflow-hidden"
                            : "opacity-100 w-auto"
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add padding to main content on mobile when sidebar is hidden */}
      {isMobile && !isOpen && <div className="h-16 md:h-0" />}
    </>
  );
}
