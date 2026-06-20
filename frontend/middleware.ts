import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  
  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/health" ||
    pathname.includes(".") || 
    pathname.startsWith("/_next"); 

  
  const token = request.cookies.get("access_token")?.value;

  
  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  
  if (token && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  
  matcher: [
    
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
