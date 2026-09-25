import "server-only";
import { cookies } from "next/headers";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  clerkEnabled,
  supabaseEnabled,
  isBootstrapAdminEmail,
} from "./config";
import { createSessionToken, verifySessionToken } from "./session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  disabled: boolean;
}

type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  disabled: boolean;
};

/** Promote configured bootstrap-admin emails to the ADMIN role (once). */
async function withAdminBootstrap(p: ProfileRow): Promise<ProfileRow> {
  if (p.role !== "ADMIN" && isBootstrapAdminEmail(p.email)) {
    try {
      await prisma.profile.update({
        where: { id: p.id },
        data: { role: "ADMIN" },
      });
      return { ...p, role: "ADMIN" };
    } catch {
      /* ignore */
    }
  }
  return p;
}

function toAuthUser(p: ProfileRow): AuthUser {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    avatarUrl: p.avatarUrl,
    role: p.role,
    disabled: p.disabled,
  };
}

/**
 * Ensure a Profile row exists for a Supabase-authenticated user (created on
 * first login), returning it. Idempotent — never creates duplicates.
 */
async function ensureProfile(input: {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<AuthUser> {
  const normalizedEmail = input.email.trim();

  const existingById = await prisma.profile.findUnique({
    where: { id: input.id },
  });

  if (existingById) {
    if (existingById.email === normalizedEmail) {
      const updated = await prisma.profile.update({
        where: { id: input.id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
        },
      });
      return toAuthUser(await withAdminBootstrap(updated));
    }

    const existingByEmail = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingByEmail && existingByEmail.id !== input.id) {
      const merged = await prisma.profile.update({
        where: { id: existingByEmail.id },
        data: {
          ...(existingByEmail.name || input.name ? { name: input.name ?? existingByEmail.name } : {}),
          ...(existingByEmail.avatarUrl || input.avatarUrl ? { avatarUrl: input.avatarUrl ?? existingByEmail.avatarUrl } : {}),
        },
      });
      return toAuthUser(await withAdminBootstrap(merged));
    }

    const updated = await prisma.profile.update({
      where: { id: input.id },
      data: {
        email: normalizedEmail,
        ...(input.name ? { name: input.name } : {}),
        ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
      },
    });
    return toAuthUser(await withAdminBootstrap(updated));
  }

  const existingByEmail = await prisma.profile.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingByEmail) {
    const merged = await prisma.profile.update({
      where: { id: existingByEmail.id },
      data: {
        ...(existingByEmail.name || input.name ? { name: input.name ?? existingByEmail.name } : {}),
        ...(existingByEmail.avatarUrl || input.avatarUrl ? { avatarUrl: input.avatarUrl ?? existingByEmail.avatarUrl } : {}),
      },
    });
    return toAuthUser(await withAdminBootstrap(merged));
  }

  const created = await prisma.profile.create({
    data: {
      id: input.id,
      email: normalizedEmail,
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
    },
  });

  return toAuthUser(await withAdminBootstrap(created));
}

/**
 * Resolve the currently authenticated user (or null), server-side only.
 * The authenticated identity is ALWAYS determined here — never trusted from
 * the client.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  if (clerkEnabled()) {
    const { userId } = await auth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    const fullName = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ") || null;

    return ensureProfile({
      id: userId,
      email,
      name: fullName,
      avatarUrl: clerkUser.imageUrl || null,
    });
  }

  if (supabaseEnabled()) {
    const supabase = createSupabaseServerClient();
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const meta = user.user_metadata ?? {};
    return ensureProfile({
      id: user.id,
      email: user.email ?? meta.email ?? "",
      name: meta.full_name ?? meta.name ?? null,
      avatarUrl: meta.avatar_url ?? meta.picture ?? null,
    });
  }

  // Local provider
  const token = cookies().get(SESSION_COOKIE)?.value;
  const uid = await verifySessionToken(token);
  if (!uid) return null;
  const profile = await prisma.profile.findUnique({ where: { id: uid } });
  if (!profile) return null;
  return toAuthUser(await withAdminBootstrap(profile));
}

/** True when the authenticated user has the ADMIN role. */
export async function getAdminUser(): Promise<AuthUser | null> {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/** Set the local session cookie for a profile id (local provider only). */
export async function setLocalSession(uid: string) {
  const token = await createSessionToken(uid);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearLocalSession() {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
