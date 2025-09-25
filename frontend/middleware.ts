// middleware.ts
import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const cookie = request.cookies.get("connect.sid");
  const hasSession = Boolean(cookie?.value);

  const isLoginRoute = url.pathname === "/login";
  const isRegisterRoute = url.pathname === "/register";
  const isForgotPasswordRoute = url.pathname === "/forgotpassword";

  if (
    hasSession &&
    (isLoginRoute || isRegisterRoute || isForgotPasswordRoute)
  ) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login/:path*", "/register/:path*", "/forgotpassword/:path*"],
};
