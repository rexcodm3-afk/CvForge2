import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthUser, setLocalSession } from "@/lib/auth/server";
import { supabaseEnabled } from "@/lib/auth/config";
import { exchangeGoogleCode, getGoogleRedirectUri } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

/**
 * OAuth / email-confirmation callback.
 * Supports Supabase when configured, otherwise uses the Google OAuth flow with
 * the Neon-backed Profile table and local signed session cookies.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl: string = request.url;
  const url: URL = new URL(requestUrl);
  const { searchParams, origin } = url;

  const code: string | null = searchParams.get("code");
  const state: string | null = searchParams.get("state");
  const cookieStore = cookies();
  const savedState: string | undefined = cookieStore.get("cvforge_google_state")?.value;
  const next: string = cookieStore.get("cvforge_google_next")?.value || "/dashboard";

  if (supabaseEnabled()) {
    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/login?error=config`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth callback exchange failed:", error.message);
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    await getAuthUser();
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const googleUser = await exchangeGoogleCode(code, getGoogleRedirectUri(origin));

  if (!googleUser) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const profile = await prisma.profile.upsert({
    where: { email: googleUser.email },
    update: {
      name: googleUser.name ?? undefined,
      avatarUrl: googleUser.avatarUrl ?? undefined,
    },
    create: {
      id: `google_${googleUser.id}`,
      email: googleUser.email,
      name: googleUser.name ?? null,
      avatarUrl: googleUser.avatarUrl ?? null,
    },
  });

  await setLocalSession(profile.id);

  const response: NextResponse = NextResponse.redirect(`${origin}${next}`);
  response.cookies.set("cvforge_google_state", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("cvforge_google_next", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
