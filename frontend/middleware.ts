import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/restaurants",
    "/privacy",
    "/terms",
    "/login",
    "/register",
    "/forgot-password",
    "/update-by-otp",
  ];

  // Define protected routes that require authentication
  const protectedRoutes = [
    "/profile",
    "/edit-profile",
    "/restaurants/create",
    "/restaurants/[id]/edit",
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/restaurants") {
      // Allow /restaurants and /restaurants/[id] (but not /restaurants/create or /restaurants/[id]/edit)
      return (
        pathname === "/restaurants" ||
        (pathname.startsWith("/restaurants/") &&
          !pathname.includes("/create") &&
          !pathname.includes("/edit"))
      );
    }
    return pathname === route || pathname.startsWith(route + "/");
  });

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => {
    if (route === "/restaurants/[id]/edit") {
      // Match pattern /restaurants/[id]/edit
      return pathname.match(/^\/restaurants\/[^\/]+\/edit$/);
    }
    return pathname === route || pathname.startsWith(route + "/");
  });

  // Check if user has authentication cookie
  const authCookie = request.cookies.get("connect.sid");
  const isAuthenticated = !!authCookie;

  // If accessing a protected route without authentication, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth routes (login, register) while authenticated, redirect to home
  if ((pathname === "/login" || pathname === "/register") && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow access to public routes and authenticated access to protected routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
