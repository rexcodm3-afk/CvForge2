/**
 * Centralized plan & pricing configuration. Change pricing here only — never
 * hard-code prices or limits in components or endpoints.
 */

export type PlanId = "free" | "pro_monthly" | "pro_yearly";
export type PlanTier = "free" | "pro";
export type BillingInterval = "month" | "year" | "none";

export interface PlanLimits {
  /** null = unlimited */
  maxCVs: number | null;
  /** PDF exports allowed per billing period (calendar month for free). */
  maxPdfExportsPerPeriod: number | null;
  maxApplications: number | null;
  maxAtsAnalyses: number | null;
  coverLetters: boolean;
  premiumTemplates: boolean;
  atsAnalyzer: boolean;
}

export interface Plan {
  id: PlanId;
  tier: PlanTier;
  name: string;
  price: number; // in minor-agnostic whole units of the currency (XAF has no decimals)
  currency: string;
  billingInterval: BillingInterval;
  /** Human features for the pricing UI. */
  features: string[];
  limits: PlanLimits;
}

export const DEFAULT_CURRENCY = "XAF";

const PRO_LIMITS: PlanLimits = {
  maxCVs: null,
  maxPdfExportsPerPeriod: null,
  maxApplications: null,
  maxAtsAnalyses: null,
  coverLetters: true,
  premiumTemplates: true,
  atsAnalyzer: true,
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    tier: "free",
    name: "Free",
    price: 0,
    currency: DEFAULT_CURRENCY,
    billingInterval: "none",
    features: [
      "1 CV",
      "Classic template",
      "1 PDF download / month",
      "Up to 3 job applications",
      "ATS check limit: 3 / month",
      "Basic application email",
    ],
    limits: {
      maxCVs: 1,
      maxPdfExportsPerPeriod: 1,
      maxApplications: 3,
      maxAtsAnalyses: 3,
      coverLetters: false,
      premiumTemplates: false,
      atsAnalyzer: true,
    },
  },
  pro_monthly: {
    id: "pro_monthly",
    tier: "pro",
    name: "CVForge Pro",
    price: 2500,
    currency: DEFAULT_CURRENCY,
    billingInterval: "month",
    features: [
      "Unlimited CVs",
      "All templates",
      "Unlimited PDF downloads",
      "Unlimited job applications",
      "Cover letters",
      "Application emails",
      "ATS analysis",
      "Job-match scoring",
    ],
    limits: PRO_LIMITS,
  },
  pro_yearly: {
    id: "pro_yearly",
    tier: "pro",
    name: "CVForge Pro",
    price: 20000,
    currency: DEFAULT_CURRENCY,
    billingInterval: "year",
    features: [
      "Unlimited CVs",
      "All templates",
      "Unlimited PDF downloads",
      "Unlimited job applications",
      "Cover letters",
      "Application emails",
      "ATS analysis",
      "Job-match scoring",
    ],
    limits: PRO_LIMITS,
  },
};

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}

export function planTier(id: string | null | undefined): PlanTier {
  return getPlan(id).tier;
}

export function isPaidPlan(id: string): id is "pro_monthly" | "pro_yearly" {
  return id === "pro_monthly" || id === "pro_yearly";
}

/** Format an amount in the given currency, e.g. 2500 XAF -> "2,500 XAF". */
export function formatMoney(amount: number, currency = DEFAULT_CURRENCY): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

/** Annual savings vs. paying monthly for a year. */
export function annualSavings(): { amount: number; percent: number } {
  const monthlyForYear = PLANS.pro_monthly.price * 12;
  const yearly = PLANS.pro_yearly.price;
  const amount = monthlyForYear - yearly;
  return {
    amount,
    percent: Math.round((amount / monthlyForYear) * 100),
  };
}
