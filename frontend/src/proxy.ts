import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Presence only — the proxy cannot know whether the session is valid.
  // This just avoids a flash of the app shell for obviously-logged-out users.
  if (!request.cookies.has("JSESSIONID")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
