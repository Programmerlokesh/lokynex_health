import { NextRequest, NextResponse } from "next/server";

// "/r" = public report page opened from the QR code (no login)
// "/clinic" = Doctor Clinic area (has its own login token, not the lab cookie)
const PUBLIC_PREFIXES = ["/login", "/superadmin", "/owner", "/clinic", "/r"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const token = request.cookies.get("lokynex-token")?.value;

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
