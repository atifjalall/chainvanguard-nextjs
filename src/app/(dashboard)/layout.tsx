"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { DashboardHeader } from "@/components/common/dashboard-header";
import CustomerHeader from "@/components/common/customer-header";
import {
  DashboardSidebar,
  SidebarProvider,
  useSidebar,
} from "@/components/common/dashboard-sidebar";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { cn } from "@/lib/utils";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar();
  const { user } = useAuth();

  const isCustomer = user?.role === "customer";

  const handleMarkAllAsRead = () => {
    window.dispatchEvent(new Event("notifications:markAllAsRead"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      {isCustomer ? (
        <CustomerHeader />
      ) : (
        <DashboardHeader onMarkAllAsRead={handleMarkAllAsRead} />
      )}
      <div className="flex">
        {!isCustomer && <DashboardSidebar />}
        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            isCustomer
              ? "ml-0"
              : isMobile
                ? "ml-0"
                : isCollapsed
                  ? "ml-16"
                  : "ml-64"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("[LAYOUT] Dashboard Layout - Auth Check:", {
      isLoading,
      isAuthenticated,
      userRole: user?.role,
      userAddress: user?.walletAddress,
    });

    // Wait until loading finishes
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        console.log("[LAYOUT] Not authenticated, redirecting to login");
        router.push("/login");
        return;
      }

      // IMPORTANT: Check localStorage directly for role as backup
      const savedUser = localStorage.getItem("chainvanguard_user");
      let hasRole = user?.role;

      if (!hasRole && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          hasRole = userData.role;
          console.log("[LAYOUT] Found role in localStorage:", hasRole);
        } catch (error) {
          console.error("[LAYOUT] Error parsing saved user:", error);
        }
      }

      // Only redirect to role selection if NO role found anywhere
      if (isAuthenticated && !hasRole) {
        console.log(
          "[LAYOUT] User authenticated but no role found, redirecting to role selection"
        );
        router.push("/role-selection");
        return;
      }

      console.log("[LAYOUT] User authenticated with role:", hasRole);
    }
  }, [isAuthenticated, isLoading, user?.role, router]);

  // Show loading spinner while auth/user is loading
  if (isLoading) {
    console.log("[LAYOUT] Dashboard loading...");
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Fallback in case user is not authenticated
  if (!isAuthenticated) {
    console.log("[LAYOUT] Dashboard: User not authenticated");
    return null;
  }

  // Check if user has role (from state or localStorage)
  let userRole = user?.role;
  if (!userRole) {
    const savedUser = localStorage.getItem("chainvanguard_user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        userRole = userData.role;
      } catch (error) {
        console.error("[LAYOUT] Error parsing user data in layout:", error);
      }
    }
  }

  // If still no role found, return loading (the useEffect will handle redirect)
  if (!userRole) {
    console.log("[LAYOUT] Waiting for role to be available...");
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  console.log("[LAYOUT] Dashboard rendering for role:", userRole);

  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
