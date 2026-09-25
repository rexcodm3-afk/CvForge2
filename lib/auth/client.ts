"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function isSupabaseConfigured(): boolean {
  const provider =
    process.env.NEXT_PUBLIC_AUTH_PROVIDER || process.env.AUTH_PROVIDER || "";

  if (provider === "local") return false;
  if (provider === "supabase") {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_DISABLE_SUPABASE
  );
}

type Result = { error?: string };

async function apiJson(path: string, body: unknown): Promise<Result> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || "Something went wrong. Please try again." };
    }
    return {};
  } catch {
    return { error: "Network error. Please check your connection." };
  }
}

export async function signUpWithPassword(
  name: string,
  email: string,
  password: string
): Promise<Result> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return { error: "Authentication is not configured." };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { error: error.message };
    // With email confirmation disabled the session is active immediately.
    return {};
  }
  return apiJson("/api/auth/signup", { name, email, password });
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<Result> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return { error: "Authentication is not configured." };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return {};
  }
  return apiJson("/api/auth/login", { email, password });
}

export async function signInWithGoogle(): Promise<Result> {
  const publicGoogleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const publicGoogleClientSecret =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  const isLocalGoogleAuth = Boolean(
    process.env.NEXT_PUBLIC_AUTH_PROVIDER === "local" ||
      process.env.AUTH_PROVIDER === "local" ||
      (publicGoogleClientId && publicGoogleClientSecret)
  );

  if (isLocalGoogleAuth) {
    if (!publicGoogleClientId || !publicGoogleClientSecret) {
      return {
        error:
          "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.",
      };
    }

    const next = encodeURIComponent(window.location.pathname || "/dashboard");
    window.location.assign(`/api/auth/google/start?next=${next}`);
    return {};
  }

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return { error: "Authentication is not configured." };

    const redirectBase =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${redirectBase}/auth/callback` },
    });
    if (error) return { error: error.message };
    return {};
  }

  return {
    error:
      "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.",
  };
}

export async function logout(): Promise<void> {
  const provider =
    process.env.NEXT_PUBLIC_AUTH_PROVIDER || process.env.AUTH_PROVIDER || "";

  if (provider === "clerk") {
    try {
      const clerk = (window as any)?.Clerk;
      if (typeof clerk?.signOut === "function") {
        await clerk.signOut({ redirectUrl: "/login" });
        return;
      }
    } catch {
      // Fall through to API logout below if Clerk is unavailable.
    }
  }

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
  }

  // Always hit the server route to clear cookies in both modes.
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
}
