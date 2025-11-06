"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  BarChart,
  Plus,
  History,
  FileText,
  ClipboardList,
  TrendingUp,
  List,
  Shield,
  Activity,
  Monitor,
  GitBranch,
  Menu,
  X,
  Wallet,
  PackageCheck,
  PackagePlus,
  Boxes,
  CreditCard,
  Inbox,
} from "lucide-react";
import { useEffect, useState } from "react";

export function DashboardSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const getNavigationItems = () => {
    switch (user?.role) {
      // 1. Supplier
      case "supplier":
        return [
          { href: "/supplier", label: "Dashboard", icon: Home },
          {
            href: "/supplier/add-inventory",
            label: "Add Inventory",
            icon: PackagePlus,
          },
          { href: "/supplier/inventory", label: "Inventory", icon: Warehouse },

          {
            href: "/supplier/vendor-requests",
            label: "Vendor Requests",
            icon: Inbox,
          },
          { href: "/supplier/vendors", label: "Vendors", icon: Users },
          {
            href: "/supplier/transactions",
            label: "Transactions",
            icon: CreditCard,
          },
          { href: "/supplier/insights", label: "Insights", icon: BarChart },
          { href: "/wallet", label: "Wallet", icon: Wallet },
        ];

      // 2. Vendor
      case "vendor":
        return [
          { href: "/vendor", label: "Dashboard", icon: Home },
          { href: "/vendor/browse", label: "Browse Inventory", icon: Boxes },
          {
            href: "/vendor/my-inventory",
            label: "My Inventory",
            icon: Warehouse,
          },
          { href: "/vendor/my-requests", label: "My Requests", icon: Inbox },
          {
            href: "/vendor/transactions",
            label: "Transactions",
            icon: CreditCard,
          },
          {
            href: "/vendor/add-product",
            label: "Add Product",
            icon: PackagePlus,
          },
          {
            href: "/vendor/my-products",
            label: "My Products",
            icon: PackageCheck,
          },
          { href: "/vendor/orders", label: "Orders", icon: ClipboardList },
          { href: "/vendor/customers", label: "Customers", icon: Users },
          { href: "/vendor/insights", label: "Insights", icon: TrendingUp },
          { href: "/vendor/history", label: "Sales History", icon: History },
          { href: "/wallet", label: "Wallet", icon: Wallet },
        ];

      // 3. Customer
      case "customer":
        return [
          { href: "/customer", label: "Dashboard", icon: Home },
          { href: "/customer/browse", label: "Browse Products", icon: Package },
          { href: "/customer/cart", label: "My Cart", icon: ShoppingCart },
          { href: "/customer/orders", label: "My Orders", icon: ClipboardList },
          { href: "/customer/history", label: "Order History", icon: History },
          { href: "/wallet", label: "Wallet", icon: Wallet },
        ];

      // 4. Blockchain Expert
      case "expert":
        return [
          { href: "/blockchain-expert", label: "Dashboard", icon: Home },
          {
            href: "/blockchain-expert/all-transactions",
            label: "All Transactions",
            icon: List,
          },
          {
            href: "/blockchain-expert/blockchain-logs",
            label: "Blockchain Logs",
            icon: FileText,
          },
          {
            href: "/blockchain-expert/consensus",
            label: "Consensus",
            icon: GitBranch,
          },
          {
            href: "/blockchain-expert/security",
            label: "Security",
            icon: Shield,
          },
          {
            href: "/blockchain-expert/fault-tolerance",
            label: "Fault Tolerance",
            icon: Activity,
          },
          {
            href: "/blockchain-expert/system-health",
            label: "System Health",
            icon: Monitor,
          },
          { href: "/wallet", label: "Wallet", icon: Wallet },
        ];

      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  // Mobile toggle button
  const MobileToggle = () => (
    <div className="md:hidden fixed top-4 left-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border-gray-300 shadow-md"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
          "fixed left-0 top-0 h-full bg-transparent backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 z-40 transition-all duration-300 ease-in-out",
          isMobile
            ? isOpen
              ? "w-64 translate-x-0"
              : "-translate-x-full"
            : "w-64 translate-x-0"
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
                  <X className="h-4 w-4" />
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
                      "w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors duration-200",
                      isActive &&
                        "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <Icon className="mr-3 h-4 w-4" />
                      {item.label}
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
