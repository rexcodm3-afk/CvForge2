import "server-only";

export function googleEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
  );
}

export function getGoogleRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/auth/callback`;
}

export function createGoogleAuthState(nextPath = "/dashboard") {
  const state = crypto.randomUUID();
  return {
    state,
    nextPath,
  };
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
} | null> {
  if (!googleEnabled()) return null;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    console.error("Google token exchange failed:", text);
    return null;
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    id_token?: string;
  };

  const accessToken = tokenData.access_token;
  if (!accessToken) return null;

  const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userResponse.ok) {
    console.error("Google user info fetch failed:", await userResponse.text());
    return null;
  }

  const user = (await userResponse.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!user?.email || !user?.sub) return null;

  return {
    id: user.sub,
    email: user.email,
    name: user.name ?? null,
    avatarUrl: user.picture ?? null,
  };
}
