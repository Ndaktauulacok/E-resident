import { NextResponse, type NextRequest } from "next/server";

// Lapisan pertama sahaja: halang laluan tanpa cookie sesi.
// Pengesahan sesi & kebenaran sebenar dibuat di server (src/lib/auth.ts).
const PUBLIC = ["/login", "/kata-laluan"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  if (!req.cookies.get("er_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/|favicon.ico|icon.svg|.*\\.(?:png|jpg|svg|webp)$).*)"] };
