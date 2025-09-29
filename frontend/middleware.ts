// middleware.ts
import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// ปิด matcher ไม่ให้จับ route ไหนเลย
export const config = {
  matcher: [],
};
