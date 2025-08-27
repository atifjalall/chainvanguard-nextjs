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
} from "lucide-react";

export function DashboardSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const getNavigationItems = () => {
    switch (user?.role) {
      // 1. Supplier
      case "supplier":
        return [
          { href: "/supplier", label: "Dashboard", icon: Home },
          { href: "/supplier/add-product", label: "Add Product", icon: Plus },
          { href: "/supplier/products", label: "Products", icon: Package },
          { href: "/supplier/inventory", label: "Inventory", icon: Warehouse },
          {
            href: "/supplier/transactions",
            label: "Transactions",
            icon: History,
          },
          { href: "/supplier/vendors", label: "Vendors", icon: Users },
          { href: "/supplier/insights", label: "Insights", icon: BarChart },
        ];

      // 2. Vendor
      case "vendor":
        return [
          { href: "/vendor", label: "Dashboard", icon: Home },
          { href: "/vendor/add-product", label: "Add Product", icon: Plus },
          { href: "/vendor/my-products", label: "My Products", icon: Package },
          { href: "/vendor/orders", label: "Orders", icon: ShoppingCart },
          { href: "/vendor/customers", label: "Customers", icon: Users },
          { href: "/vendor/insights", label: "Insights", icon: TrendingUp },
          {
            href: "/vendor/history",
            label: "Sales History",
            icon: History,
          },
        ];

      // 3. Customer
      case "customer":
        return [
          { href: "/customer", label: "Dashboard", icon: Home },
          { href: "/customer/browse", label: "Browse Products", icon: Package },
          { href: "/customer/cart", label: "My Cart", icon: ShoppingCart },
          { href: "/customer/orders", label: "My Orders", icon: ClipboardList },
          { href: "/customer/history", label: "Order History", icon: History },
        ];

      // 4. Blockchain Expert
      case "blockchain-expert":
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
        ];

      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case "blockchain-expert":
        return "Blockchain Expert";
      case "supplier":
        return "Supplier Portal";
      case "vendor":
        return "Vendor Portal";
      case "customer":
        return "Customer Portal";
      default:
        return "Navigation";
    }
  };

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50">
      <div className="h-full py-6 overflow-y-auto">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {getRoleDisplayName(user?.role)}
          </h2>
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50",
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
  );
}
