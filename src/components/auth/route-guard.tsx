"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * RouteGuard Component
 * Client-side route protection that redirects users trying to access unauthorized routes
 * This complements server-side middleware protection
 */
export function RouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Don't check if pathname is null
    if (!pathname) {
      return;
    }

    // Don't check until auth is loaded
    if (isLoading) {
      console.log("[ROUTE GUARD] ⏳ Waiting for auth to load...");
      return;
    }

    // Skip check for unauthenticated users (middleware will handle)
    if (!isAuthenticated || !user) {
      console.log("[ROUTE GUARD] ⚠️ No authenticated user, skipping guard");
      return;
    }

    const userRole = user.role;
    console.log("=================================");
    console.log(`[ROUTE GUARD] 🔍 Checking route: ${pathname}`);
    console.log(`[ROUTE GUARD] 👤 User role: ${userRole}`);

    // Define role-to-dashboard mapping
    const roleDashboards: Record<string, string> = {
      customer: "/customer",
      vendor: "/vendor",
      supplier: "/supplier",
      expert: "/expert",
    };

    // Define role-specific route patterns
    const roleRoutes: Record<string, RegExp> = {
      customer: /^\/(customer)/,
      vendor: /^\/(vendor)/,
      supplier: /^\/(supplier)/,
      expert: /^\/(expert)/,
    };

    // Shared routes accessible by all authenticated users
    const sharedRoutes = ["/wallet", "/notifications", "/wishlist"];
    const isSharedRoute = sharedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isSharedRoute) {
      console.log(`[ROUTE GUARD] ✅ Shared route - allowing access`);
      console.log("=================================");
      return;
    }

    // Check if user is trying to access a route for a different role
    for (const [role, pattern] of Object.entries(roleRoutes)) {
      if (pattern.test(pathname)) {
        console.log(`[ROUTE GUARD] 🎯 Route belongs to: ${role}`);

        if (role !== userRole) {
          // User doesn't have permission for this role - REDIRECT to their dashboard home
          const redirectTo = roleDashboards[userRole] || "/";

          console.log(
            `[ROUTE GUARD] ❌ BLOCKED: ${userRole} cannot access ${role} route!`
          );
          console.log(`[ROUTE GUARD] 📍 Attempted path: ${pathname}`);
          console.log(`[ROUTE GUARD] 🔄 Redirecting to: ${redirectTo}`);
          console.log("=================================");

          // Perform the redirect to role dashboard home
          router.replace(redirectTo);
          return;
        }

        console.log(`[ROUTE GUARD] ✅ Access granted to ${userRole}`);
        console.log("=================================");
        return;
      }
    }

    console.log(`[ROUTE GUARD] ℹ️ Route not role-specific, allowing access`);
    console.log("=================================");
  }, [pathname, user, isAuthenticated, isLoading, router]);

  // This component doesn't render anything
  return null;
}
