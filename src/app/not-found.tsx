"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) {
      return;
    }

    // If user is authenticated, redirect to their role-specific dashboard
    if (isAuthenticated && user?.role) {
      const roleDashboards: Record<string, string> = {
        customer: "/customer",
        vendor: "/vendor",
        supplier: "/supplier",
        expert: "/expert",
      };

      const redirectTo = roleDashboards[user.role];

      if (redirectTo) {
        console.log(`[404] Redirecting ${user.role} to ${redirectTo}`);
        router.replace(redirectTo);
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleGoBack = () => {
    if (isAuthenticated && user?.role) {
      const roleDashboards: Record<string, string> = {
        customer: "/customer",
        vendor: "/vendor",
        supplier: "/supplier",
        expert: "/expert",
      };

      const redirectTo = roleDashboards[user.role] || "/";
      router.push(redirectTo);
    } else {
      router.push("/");
    }
  };

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated, show a brief message before redirect
  if (isAuthenticated && user?.role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // For unauthenticated users, show 404 page
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleGoBack} size="lg">
            Go to Home
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
