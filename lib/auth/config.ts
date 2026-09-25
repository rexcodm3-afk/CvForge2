/**
 * Auth configuration.
 *
 * CVForge supports two interchangeable authentication backends that both
 * resolve to a `Profile` row in the same Postgres database:
 *
 *  - **Supabase** (production): used when the Supabase env vars are present.
 *    Handles email/password, Google OAuth and session cookies.
 *  - **Local** (zero-config / self-hosted dev): used when Supabase is not
 *    configured. Real password hashing (scrypt) against the `Profile` table
 *    with a signed, HTTP-only session cookie. Never localStorage, never fake.
 *
 * This lets the project run with `npm install && npm run dev` out of the box,
 * and switch to Supabase simply by setting the env vars — no code changes.
 */
export function supabaseEnabled(): boolean {
  const provider =
    process.env.AUTH_PROVIDER || process.env.NEXT_PUBLIC_AUTH_PROVIDER || "";

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

export function clerkEnabled(): boolean {
  const provider =
    process.env.AUTH_PROVIDER || process.env.NEXT_PUBLIC_AUTH_PROVIDER || "";

  if (provider === "supabase" || provider === "local") return false;

  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
  );
}

export const SESSION_COOKIE = "cvforge_session";

/**
 * Emails that should be treated as platform administrators. Configured via the
 * ADMIN_EMAILS env var (comma-separated). A matching account is promoted to the
 * ADMIN role in the database on login — the DB role remains the source of truth.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isBootstrapAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

export function sessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    // Dev fallback so the app never crashes without config. Set SESSION_SECRET
    // in any real deployment that uses the local auth provider.
    "cvforge-insecure-development-secret-please-override"
  );
}
