import { SignIn } from "@clerk/nextjs";

export default function SignInPage({
  searchParams,
}: {
  searchParams?: { redirect_url?: string };
}) {
  const redirectUrl = searchParams?.redirect_url || "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50/40 px-4 py-12">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
      />
    </main>
  );
}
