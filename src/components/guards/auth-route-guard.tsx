"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthRouteGuardProps {
  children: React.ReactNode;
}

/**
 * AuthRouteGuard - Prevents authenticated users from accessing login/register/forgot-password pages
 * @param {React.ReactNode} children - The child components to render if not authenticated
 * @returns {React.ReactNode} - The rendered component
 */
export function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    try {
      const savedUser = localStorage.getItem("chainvanguard_auth_user");
      const authToken = localStorage.getItem("chainvanguard_auth_token");

      if (savedUser && authToken) {
        try {
          const userData = JSON.parse(savedUser);

          if (userData.role && userData.walletAddress) {
            console.log(
              "[AUTH-GUARD] User is authenticated, redirecting to dashboard:",
              userData.role
            );
            setIsAuthenticated(true);

            // Redirect to user's dashboard
            router.replace(`/${userData.role}`);
            return;
          }
        } catch (error) {
          console.error("[AUTH-GUARD] Error parsing user data:", error);
          // Clear invalid data
          localStorage.removeItem("chainvanguard_auth_user");
          localStorage.removeItem("chainvanguard_auth_token");
        }
      }

      // User is not authenticated, allow access to auth pages
      console.log("[AUTH-GUARD] User not authenticated, showing auth page");
      setIsChecking(false);
    } catch (error) {
      console.error("[AUTH-GUARD] Error checking authentication:", error);
      setIsChecking(false);
    }
  };

  // Show loading skeleton while checking or redirecting
  if (isChecking || isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // User is not authenticated, render the auth page
  return <>{children}</>;
}
