import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ROLES_ALLOWED_TO_AUTH = ["USER", "ADMIN", "DELIVERY", "WAITER", "MANAGER", "CHEF", "BARTENDER"];

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined;

    if (
      (req.nextUrl.pathname.startsWith("/dashboard") && role !== "ADMIN") ||
      (req.nextUrl.pathname.startsWith("/api/graphql") && role !== "ADMIN")
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Kitchen: ADMIN, MANAGER, CHEF
    if (
      req.nextUrl.pathname.startsWith("/kitchen") &&
      !["ADMIN", "MANAGER", "CHEF"].includes(role ?? "")
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Bar: ADMIN, MANAGER, BARTENDER
    if (
      req.nextUrl.pathname.startsWith("/bar") &&
      !["ADMIN", "MANAGER", "BARTENDER"].includes(role ?? "")
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (
      (req.nextUrl.pathname.startsWith("/user") && !req.nextauth.token) ||
      (req.nextUrl.pathname.startsWith("/pay") && !req.nextauth.token) ||
      (req.nextUrl.pathname.startsWith("/payment-success") &&
        !req.nextauth.token)
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) =>
        token?.role !== undefined && ROLES_ALLOWED_TO_AUTH.includes(token.role),
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/user/:path*", "/pay/:path*", "/payment-success", "/kitchen/:path*", "/bar/:path*"],
};