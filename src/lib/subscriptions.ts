export type PlanKey = "free" | "seeker" | "oracle";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  priceLabel: string;
  summary: string;
  badge?: string;
  ctaLabel: string;
  features: string[];
}

export interface SubscriptionEntitlements {
  planKey: PlanKey;
  planName: string;
  status: string;
  hasPaidPlan: boolean;
  isFree: boolean;
  canUseVoice: boolean;
  voiceSecondsLimit: number | null;
  voiceSecondsUsed: number;
  voiceSecondsRemaining: number | null;
  voiceUnlimited: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface VoiceUsageSnapshot {
  voiceSecondsUsed: number;
  voiceSecondsRemaining: number | null;
  voiceUnlimited: boolean;
}

export interface VoiceApiError {
  error: string;
  code?: string;
  entitlements?: SubscriptionEntitlements | null;
}

export const SEEKER_VOICE_SECONDS_LIMIT = 30 * 60;

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    key: "free",
    name: "Free",
    priceLabel: "$0/month",
    summary: "A direct text reading room for anyone who wants to try Courtney first.",
    ctaLabel: "Current free tier",
    features: [
      "Unlimited text chat with Courtney",
      "Save your reading history to your account",
      "Upgrade into voice chat whenever you want",
    ],
  },
  {
    key: "seeker",
    name: "Seeker",
    priceLabel: "$3.99/month",
    summary: "A light monthly plan for people who want Courtney to answer out loud.",
    badge: "Most approachable",
    ctaLabel: "Start Seeker",
    features: [
      "Everything in Free",
      "30 minutes of Courtney voice chat each month",
      "See your remaining voice time inside chat",
    ],
  },
  {
    key: "oracle",
    name: "Oracle",
    priceLabel: "$8.99/month",
    summary: "The full voice experience for people who want to stay in conversation.",
    badge: "Best value",
    ctaLabel: "Start Oracle",
    features: [
      "Everything in Seeker",
      "Unlimited Courtney voice chat",
      "Priority path into the full voice experience",
    ],
  },
];

export const DEFAULT_ENTITLEMENTS: SubscriptionEntitlements = {
  planKey: "free",
  planName: "Free",
  status: "free",
  hasPaidPlan: false,
  isFree: true,
  canUseVoice: false,
  voiceSecondsLimit: 0,
  voiceSecondsUsed: 0,
  voiceSecondsRemaining: 0,
  voiceUnlimited: false,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

export const formatSecondsAsMinutes = (seconds: number) => {
  const wholeMinutes = Math.max(1, Math.ceil(seconds / 60));
  return `${wholeMinutes} min`;
};

export const getRemainingVoiceLabel = (entitlements: SubscriptionEntitlements) => {
  if (entitlements.voiceUnlimited) {
    return "Unlimited voice";
  }

  return formatSecondsAsMinutes(entitlements.voiceSecondsRemaining ?? 0);
};

export const getPlanDefinition = (planKey: PlanKey) =>
  PLAN_DEFINITIONS.find((plan) => plan.key === planKey) ?? PLAN_DEFINITIONS[0];
