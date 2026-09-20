import { getPlan, type PlanId, type PlanLimits } from "@/lib/plans";

/** Named features gated by plan. Add future features (AI, ATS) here. */
export type Feature =
  | "CREATE_MULTIPLE_CVS"
  | "PREMIUM_TEMPLATES"
  | "PDF_EXPORT"
  | "UNLIMITED_PDF_EXPORT"
  | "COVER_LETTERS"
  | "APPLICATION_EMAILS"
  | "UNLIMITED_APPLICATIONS"
  | "AI_ASSISTANT"
  | "ATS_ANALYZER";

export interface UsageCounts {
  cvCount: number;
  pdfExportCount: number;
  applicationCount: number;
  atsAnalysisCount: number;
}

export interface EntitlementContext {
  planId: PlanId;
  usage: UsageCounts;
}

const PREMIUM_TEMPLATE_IDS = ["modern", "minimal"];

export function isPremiumTemplate(template: string): boolean {
  return PREMIUM_TEMPLATE_IDS.includes(template);
}

function limits(planId: PlanId): PlanLimits {
  return getPlan(planId).limits;
}

/** Whether the plan is entitled to a feature at all (ignoring usage counts). */
export function planHasFeature(planId: PlanId, feature: Feature): boolean {
  const l = limits(planId);
  switch (feature) {
    case "PREMIUM_TEMPLATES":
      return l.premiumTemplates;
    case "COVER_LETTERS":
      return l.coverLetters;
    case "UNLIMITED_PDF_EXPORT":
      return l.maxPdfExportsPerPeriod === null;
    case "UNLIMITED_APPLICATIONS":
      return l.maxApplications === null;
    case "CREATE_MULTIPLE_CVS":
      return l.maxCVs === null || l.maxCVs > 1;
    case "PDF_EXPORT":
    case "APPLICATION_EMAILS":
      return true; // available on all plans (free has a monthly limit for PDF)
    case "AI_ASSISTANT":
      return false; // reserved for a future sprint
    case "ATS_ANALYZER":
      return l.atsAnalyzer;
    default:
      return false;
  }
}

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: "upgrade" | "limit"; feature: Feature; message: string };

/**
 * The single entitlement gate. Considers both plan features and usage limits.
 * Server endpoints and UI both go through this — no scattered `isPremium`.
 */
export function canAccess(
  ctx: EntitlementContext,
  feature: Feature,
  extra?: { template?: string }
): AccessResult {
  const l = limits(ctx.planId);

  switch (feature) {
    case "CREATE_MULTIPLE_CVS": {
      if (l.maxCVs === null) return { allowed: true };
      if (ctx.usage.cvCount < l.maxCVs) return { allowed: true };
      return {
        allowed: false,
        reason: "limit",
        feature,
        message: "You've reached the Free plan CV limit.",
      };
    }
    case "PDF_EXPORT": {
      if (l.maxPdfExportsPerPeriod === null) return { allowed: true };
      if (ctx.usage.pdfExportCount < l.maxPdfExportsPerPeriod)
        return { allowed: true };
      return {
        allowed: false,
        reason: "limit",
        feature,
        message: "You've used your free PDF download this month.",
      };
    }
    case "PREMIUM_TEMPLATES": {
      const template = extra?.template;
      // Only blocks when a premium template is actually requested.
      if (template && !isPremiumTemplate(template)) return { allowed: true };
      if (l.premiumTemplates) return { allowed: true };
      return {
        allowed: false,
        reason: "upgrade",
        feature,
        message: "Modern and Minimal templates are part of CVForge Pro.",
      };
    }
    case "UNLIMITED_APPLICATIONS": {
      if (l.maxApplications === null) return { allowed: true };
      if (ctx.usage.applicationCount < l.maxApplications)
        return { allowed: true };
      return {
        allowed: false,
        reason: "limit",
        feature,
        message: "You've reached the Free plan application limit.",
      };
    }
    case "COVER_LETTERS": {
      if (l.coverLetters) return { allowed: true };
      return {
        allowed: false,
        reason: "upgrade",
        feature,
        message: "Cover letters are part of CVForge Pro.",
      };
    }
    case "ATS_ANALYZER": {
      if (!l.atsAnalyzer) {
        return {
          allowed: false,
          reason: "upgrade",
          feature,
          message: "ATS checks are part of CVForge Pro.",
        };
      }
      if (l.maxAtsAnalyses === null) return { allowed: true };
      if (ctx.usage.atsAnalysisCount < l.maxAtsAnalyses) return { allowed: true };
      return {
        allowed: false,
        reason: "limit",
        feature,
        message: "You've used your free ATS analysis limit for this month.",
      };
    }
    default:
      return planHasFeature(ctx.planId, feature)
        ? { allowed: true }
        : {
            allowed: false,
            reason: "upgrade",
            feature,
            message: "This feature is part of CVForge Pro.",
          };
  }
}
