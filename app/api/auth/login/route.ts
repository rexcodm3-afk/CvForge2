import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setLocalSession } from "@/lib/auth/server";
import { supabaseEnabled } from "@/lib/auth/config";
import { isValidEmail } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (supabaseEnabled()) {
    return NextResponse.json(
      { error: "Login is handled by Supabase in this environment." },
      { status: 400 }
    );
  }
  try {
    const { email, password } = await req.json();

    if (!email || !isValidEmail(String(email))) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { email: "bricemunji06@gmail.com" },
    });

    const passwordMatches =
      !!profile?.passwordHash &&
      (await bcrypt.compare(String(password), profile.passwordHash));
    if (!profile || !passwordMatches) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await setLocalSession(profile.id);
    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        ...(profile.role === "ADMIN" ? { role: "ADMIN" } : {}),
      },
    });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    return NextResponse.json(
      { error: "We couldn't log you in. Please try again." },
      { status: 500 }
    );
  }
}
