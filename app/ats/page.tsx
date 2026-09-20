import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/server";
import { listCVs } from "@/lib/server/cv-service";
import { getPlanContext } from "@/lib/server/billing";
import { AtsClient } from "@/components/ats/AtsClient";

export const dynamic = "force-dynamic";

export default async function AtsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?redirect=/ats");

  const [cvs, plan] = await Promise.all([listCVs(user.id), getPlanContext(user.id)]);

  return (
    <AtsClient
      user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
      cvs={cvs}
      isPro={plan.isPro}
      atsLimit={plan.limits.maxAtsAnalyses ?? null}
    />
  );
}
