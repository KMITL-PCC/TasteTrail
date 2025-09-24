import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

// // This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  //   const cookieStore = await cookies();
  //   const userSession = cookieStore.get("connect.sid");
  //   const url = request.nextUrl.clone();
  //   const isLoginRoute = url.pathname === "/login";
  //   const isRegisterRoute = url.pathname === "/registe";
  //   const isForGotPasswordRoute = url.pathname === "/forgotpassword";
  //   if (isLoginRoute) {
  //   if (!userSession) {
  //       return NextResponse.next();
  //     }
  //     url.pathname = "/";
  //     return NextResponse.redirect(url);
  //   }
  //   if (isRegisterRoute) {
  //       if (!userSession) {
  //           return NextResponse.next();
  //         }
  //         url.pathname = "/";
  //         return NextResponse.redirect(url);
  //       }
  //       if (isForGotPasswordRoute) {
  //           if (!userSession) {
  //     return NextResponse.next();
  //   }
  //   url.pathname = "/";
  //   return NextResponse.redirect(url);
  // }
  return NextResponse.next();
}

// export const config = {
//   matcher: ["/login/:path*", "/register/:path*", "/forgotpassword/:path*"],
// };
export const config = {
  matcher: ["/:path*"],
};
