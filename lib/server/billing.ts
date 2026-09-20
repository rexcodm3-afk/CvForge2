import "server-only";
import { prisma } from "@/lib/prisma";
import {
  getPlan,
  planTier,
  isPaidPlan,
  type PlanId,
  type PlanLimits,
  type PlanTier,
} from "@/lib/plans";
import type { UsageCounts } from "@/lib/entitlements";

export type SubStatus =
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED"
  | "INACTIVE";

export interface PlanContext {
  planId: PlanId;
  tier: PlanTier;
  isPro: boolean;
  status: SubStatus;
  limits: PlanLimits;
  usage: UsageCounts;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    currentPeriodStart: string | null;
    startDate: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

/** Current calendar-month billing period [start, end). */
export function currentPeriod(now = new Date()): {
  periodStart: Date;
  periodEnd: Date;
} {
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  return { periodStart, periodEnd };
}

/** Live usage counts (the source of truth for limit enforcement). */
export async function getUsageCounts(userId: string): Promise<UsageCounts> {
  const { periodStart, periodEnd } = currentPeriod();
  const [cvCount, applicationCount, pdfExportCount, atsAnalysisCount] =
    await Promise.all([
      prisma.cV.count({ where: { userId } }),
      prisma.application.count({ where: { userId } }),
      prisma.exportEvent.count({
        where: {
          userId,
          type: "PDF_DOWNLOAD",
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      prisma.atsAnalysis.count({
        where: {
          userId,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
    ]);
  return { cvCount, applicationCount, pdfExportCount, atsAnalysisCount };
}

/** Best-effort: keep a Usage row for the current period (analytics / resets). */
export async function syncUsageRow(userId: string): Promise<void> {
  try {
    const { periodStart, periodEnd } = currentPeriod();
    const counts = await getUsageCounts(userId);
    await prisma.usage.upsert({
      where: { userId_periodStart: { userId, periodStart } },
      update: {
        periodEnd,
        cvCount: counts.cvCount,
        pdfExportCount: counts.pdfExportCount,
        applicationCount: counts.applicationCount,
        atsAnalysisCount: counts.atsAnalysisCount,
      },
      create: {
        userId,
        periodStart,
        periodEnd,
        cvCount: counts.cvCount,
        pdfExportCount: counts.pdfExportCount,
        applicationCount: counts.applicationCount,
        atsAnalysisCount: counts.atsAnalysisCount,
      },
    });
  } catch (err) {
    console.error("syncUsageRow failed:", err);
  }
}

/**
 * Resolve the user's effective plan — THE source of truth.
 * Lazily expires a subscription whose paid period has ended.
 */
export async function getPlanContext(userId: string): Promise<PlanContext> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const usage = await getUsageCounts(userId);
  const now = new Date();

  let planId: PlanId = "free";
  let status: SubStatus = (sub?.status as SubStatus) ?? "INACTIVE";

  if (sub && isPaidPlan(sub.plan)) {
    const activeish = status === "ACTIVE" || status === "TRIALING";
    // Admin-granted Pro never expires by period; it ends only on revoke.
    if (sub.grantType === "admin") {
      if (activeish) planId = sub.plan as PlanId;
    } else {
      const periodValid = sub.currentPeriodEnd
        ? sub.currentPeriodEnd > now
        : false;
      if (activeish && periodValid) {
        planId = sub.plan as PlanId;
      } else if (sub.currentPeriodEnd && !periodValid && status !== "EXPIRED") {
        // Paid period has ended and wasn't renewed — expire (data is never deleted).
        await prisma.subscription
          .update({ where: { userId }, data: { status: "EXPIRED" } })
          .catch(() => {});
        status = "EXPIRED";
      }
    }
  }

  const tier = planTier(planId);
  return {
    planId,
    tier,
    isPro: tier === "pro",
    status,
    limits: getPlan(planId).limits,
    usage,
    subscription: sub
      ? {
          plan: sub.plan,
          status,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
          startDate: sub.startDate?.toISOString() ?? null,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        }
      : null,
  };
}
