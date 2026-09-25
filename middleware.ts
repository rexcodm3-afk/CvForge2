import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { SESSION_COOKIE, clerkEnabled, supabaseEnabled } from "@/lib/auth/config";
import { isAuthedRedirectPage } from "@/lib/auth/redirects";
import { verifySessionToken } from "@/lib/auth/session";

const PROTECTED = [
  "/dashboard",
  "/builder",
  "/cover-letters",
  "/applications",
  "/application-email",
  "/settings",
  "/checkout",
  "/payment",
  "/admin",
];
export default clerkMiddleware(async (auth, req) => {
  const { pathname, searchParams } = req.nextUrl;
  const res = NextResponse.next();

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthPage = isAuthedRedirectPage(pathname);
  if (!isProtected && !isAuthPage) return res;

  let authed = false;

  if (clerkEnabled()) {
    const { userId } = await auth();
    authed = Boolean(userId);
  } else if (supabaseEnabled()) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }[]
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authed = Boolean(user);
  } else {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    authed = Boolean(await verifySessionToken(token));
  }

  if (clerkEnabled() && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    const redirectTarget = searchParams.get("redirect") || "/dashboard";
    url.search = "";
    url.searchParams.set("redirect_url", redirectTarget);
    return NextResponse.redirect(url);
  }

  if (clerkEnabled() && pathname === "/signup") {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-up";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isProtected && !authed) {
    const url = req.nextUrl.clone();
    if (clerkEnabled()) {
      url.pathname = "/sign-in";
      url.search = "";
      url.searchParams.set("redirect_url", pathname);
    } else {
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  if (isAuthPage && authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
});

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/builder/:path*",
    "/cover-letters/:path*",
    "/applications/:path*",
    "/application-email/:path*",
    "/settings/:path*",
    "/checkout/:path*",
    "/payment/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/__clerk/:path*",
  ],
};
