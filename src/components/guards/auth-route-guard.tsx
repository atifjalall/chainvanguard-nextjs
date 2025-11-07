"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/_ui/skeleton";
import { Card, CardContent } from "@/components/_ui/card";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-48 mx-auto" />
                <Skeleton className="h-3 w-32 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is not authenticated, render the auth page
  return <>{children}</>;
}
