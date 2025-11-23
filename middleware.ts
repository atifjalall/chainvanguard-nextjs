// middleware.ts (in root directory)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  console.log("=================================");
  console.log(`[MIDDLEWARE] 🔍 Processing: ${pathname}`);
  console.log("=================================");

  // Check if it's an API route
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/role-selection",
    "/about",
    "/contact",
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Get the auth token from cookies or headers
  const authToken =
    request.cookies.get("auth_token")?.value ||
    request.headers.get("authorization");

  console.log(`[MIDDLEWARE] Auth token present: ${!!authToken}`);
  console.log(`[MIDDLEWARE] Is public route: ${isPublicRoute}`);

  // If trying to access protected route without auth token
  if (!isPublicRoute && !authToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (authToken && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role-based route protection
  if (authToken) {
    console.log(`[MIDDLEWARE] 🔐 Starting role-based protection check`);

    // Get user role from cookie
    let userRole = request.cookies.get("user_role")?.value;
    let needsRoleCookie = false;

    console.log(`[MIDDLEWARE] User role from cookie: ${userRole || 'NOT FOUND'}`);

    // If no role cookie, try to decode from auth token
    if (!userRole && authToken) {
      try {
        // Remove Bearer prefix if present
        const token = authToken.startsWith("Bearer ")
          ? authToken.substring(7)
          : authToken;

        // Decode JWT payload
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString()
        );
        userRole = payload.role;
        needsRoleCookie = true;
        console.log(`[MIDDLEWARE] Decoded role from token: ${userRole}`);
      } catch (e) {
        console.error("[MIDDLEWARE] Failed to decode token:", e);
      }
    } else if (userRole) {
      console.log(`[MIDDLEWARE] Found role in cookie: ${userRole}`);
    }

    // Define role-to-dashboard mapping
    const roleDashboards: Record<string, string> = {
      customer: "/customer",
      vendor: "/vendor",
      supplier: "/supplier",
      expert: "/blockchain-expert",
    };

    // Define role-specific route patterns
    const roleRoutes: Record<string, RegExp> = {
      customer: /^\/(customer)/,
      vendor: /^\/(vendor)/,
      supplier: /^\/(supplier)/,
      expert: /^\/(blockchain-expert)/,
    };

    // Shared routes accessible by all authenticated users (except customers for wallet and profile)
    const sharedRoutes = ["/wallet", "/notifications", "/wishlist", "/profile"];
    const isSharedRoute = sharedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    console.log(`[MIDDLEWARE] Is shared route: ${isSharedRoute}`);

    // Redirect customers from public wallet/profile to their customer-specific pages
    if (userRole === "customer" && (pathname === "/wallet" || pathname === "/profile")) {
      console.log(
        `[MIDDLEWARE] 🔄 Redirecting customer from ${pathname} to /customer${pathname}`
      );
      const url = request.nextUrl.clone();
      url.pathname = `/customer${pathname}`;
      return NextResponse.redirect(url);
    }

    // Check if user is trying to access a role-specific route
    if (!isSharedRoute) {
      console.log(`[MIDDLEWARE] 🎯 Checking role-specific routes (not a shared route)`);

      // Check if the current path belongs to a different role
      for (const [role, pattern] of Object.entries(roleRoutes)) {
        console.log(`[MIDDLEWARE] Testing pattern for role '${role}': ${pattern}`);
        if (pattern.test(pathname)) {
          console.log(`[MIDDLEWARE] ✅ Pattern matched! Route belongs to: ${role}`);
          // User is accessing a role-specific route
          if (!userRole) {
            // No role found - redirect to login
            console.log(
              `[MIDDLEWARE] No role found, redirecting from ${pathname} to /login`
            );
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
          }

          if (role !== userRole) {
            // User doesn't have permission for this role - REDIRECT
            console.log(
              `[MIDDLEWARE] ❌ BLOCKED: ${userRole} trying to access ${role} route ${pathname}`
            );
            console.log(
              `[MIDDLEWARE] Redirecting to ${roleDashboards[userRole]}`
            );

            const url = request.nextUrl.clone();
            url.pathname = roleDashboards[userRole] || "/";
            const response = NextResponse.redirect(url);

            // Set role cookie if needed
            if (needsRoleCookie && userRole) {
              response.cookies.set("user_role", userRole, {
                path: "/",
                maxAge: 30 * 24 * 60 * 60,
                sameSite: "lax",
              });
            }

            return response;
          }

          // User has correct role, allow access
          console.log(
            `[MIDDLEWARE] ✅ ALLOWED: ${userRole} accessing ${pathname}`
          );
          break;
        }
      }
    } else {
      console.log(`[MIDDLEWARE] ⚠️ Skipping role check - this is a shared route`);
    }

    // If we need to set the role cookie and we're not redirecting, set it on the response
    if (needsRoleCookie && userRole) {
      const response = NextResponse.next();
      response.cookies.set("user_role", userRole, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
      });
      return response;
    }
  }

  console.log(`[MIDDLEWARE] ➡️ Allowing request to proceed to: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
