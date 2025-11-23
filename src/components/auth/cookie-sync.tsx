"use client";

import { useEffect } from "react";

/**
 * CookieSync Component
 * Ensures auth tokens and user role from localStorage are synced to cookies
 * This is necessary for server-side middleware to access user authentication state
 */
export function CookieSync() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const syncCookies = () => {
      try {
        console.log("=================================");
        console.log("[COOKIE SYNC] 🔄 Starting cookie sync...");

        // Get auth token from localStorage
        const token =
          localStorage.getItem("chainvanguard_auth_token") ||
          localStorage.getItem("token");

        console.log(`[COOKIE SYNC] Token found in localStorage: ${!!token}`);

        // Get user data from localStorage
        const userStr =
          localStorage.getItem("chainvanguard_auth_user") ||
          localStorage.getItem("chainvanguard_user");

        console.log(`[COOKIE SYNC] User data found in localStorage: ${!!userStr}`);

        // If we have a token, set it as a cookie
        if (token) {
          document.cookie = `auth_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
          console.log("[COOKIE SYNC] ✅ Auth token synced to cookie");
          console.log(`[COOKIE SYNC] Token length: ${token.length} characters`);
        }

        // If we have user data, extract and set the role cookie
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            console.log(`[COOKIE SYNC] User email: ${user.email}`);
            console.log(`[COOKIE SYNC] User role: ${user.role}`);

            if (user.role) {
              document.cookie = `user_role=${user.role}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
              console.log(`[COOKIE SYNC] ✅ User role '${user.role}' synced to cookie`);

              // Verify the cookie was set
              const cookies = document.cookie;
              console.log(`[COOKIE SYNC] All cookies: ${cookies}`);
            } else {
              console.warn("[COOKIE SYNC] ⚠️ User object has no role property!");
            }
          } catch (e) {
            console.error("[COOKIE SYNC] ❌ Failed to parse user data:", e);
          }
        }

        // If no token or user, clear the cookies
        if (!token || !userStr) {
          document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
          document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
          console.log("[COOKIE SYNC] ⚠️ No auth data found, cleared cookies");
        }

        console.log("[COOKIE SYNC] 🏁 Cookie sync complete");
        console.log("=================================");
      } catch (error) {
        console.error("[COOKIE SYNC] ❌ Error syncing cookies:", error);
      }
    };

    // Sync immediately on mount
    syncCookies();

    // Also sync when localStorage changes (e.g., after login)
    window.addEventListener("storage", syncCookies);

    return () => {
      window.removeEventListener("storage", syncCookies);
    };
  }, []);

  return null; // This component doesn't render anything
}
