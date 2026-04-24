import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authorizedApiFetch } from "@/lib/authHeaders";
import {
  DEFAULT_ENTITLEMENTS,
  type PlanKey,
  type SubscriptionEntitlements,
  type VoiceUsageSnapshot,
} from "@/lib/subscriptions";
import { isLocalPreview } from "@/lib/preview";

type CheckoutState = "idle" | "loading";

interface UseSubscriptionOptions {
  disabled?: boolean;
}

const parseErrorMessage = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => null);
  const details = data?.details ? ` ${data.details}` : "";
  return `${data?.error || fallback}${details}`;
};

export function useSubscription({ disabled = false }: UseSubscriptionOptions = {}) {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<SubscriptionEntitlements>(DEFAULT_ENTITLEMENTS);
  const [loading, setLoading] = useState(!disabled && !isLocalPreview);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [billingState, setBillingState] = useState<CheckoutState>("idle");

  const refreshEntitlements = useCallback(async () => {
    if (disabled || isLocalPreview || !user) {
      setEntitlements(DEFAULT_ENTITLEMENTS);
      setLoading(false);
      return DEFAULT_ENTITLEMENTS;
    }

    setLoading(true);

    try {
      const response = await authorizedApiFetch("/api/subscriptions/entitlements", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "Unable to load your plan"));
      }

      const data = await response.json();
      const nextEntitlements = (data?.entitlements ?? DEFAULT_ENTITLEMENTS) as SubscriptionEntitlements;
      setEntitlements(nextEntitlements);
      return nextEntitlements;
    } catch (error) {
      console.error("Failed to refresh entitlements:", error);
      setEntitlements(DEFAULT_ENTITLEMENTS);
      return DEFAULT_ENTITLEMENTS;
    } finally {
      setLoading(false);
    }
  }, [disabled, user]);

  useEffect(() => {
    void refreshEntitlements();
  }, [refreshEntitlements]);

  const startCheckout = useCallback(async (planKey: PlanKey) => {
    setCheckoutState("loading");

    try {
      const response = await authorizedApiFetch("/api/subscriptions/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planKey }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.url) {
        const details = data?.details ? ` ${data.details}` : "";
        throw new Error(`${data?.error || "Unable to start checkout"}${details}`);
      }

      window.location.href = data.url;
    } finally {
      setCheckoutState("idle");
    }
  }, []);

  const openBillingPortal = useCallback(async () => {
    setBillingState("loading");

    try {
      const response = await authorizedApiFetch("/api/subscriptions/customer-portal", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.url) {
        const details = data?.details ? ` ${data.details}` : "";
        throw new Error(`${data?.error || "Unable to open billing"}${details}`);
      }

      window.location.href = data.url;
    } finally {
      setBillingState("idle");
    }
  }, []);

  const applyVoiceUsage = useCallback((usage: VoiceUsageSnapshot) => {
    setEntitlements((current) => ({
      ...current,
      voiceSecondsUsed: usage.voiceSecondsUsed,
      voiceSecondsRemaining: usage.voiceSecondsRemaining,
      voiceUnlimited: usage.voiceUnlimited,
      canUseVoice: current.hasPaidPlan && (usage.voiceUnlimited || (usage.voiceSecondsRemaining ?? 0) > 0),
    }));
  }, []);

  const syncEntitlements = useCallback((nextEntitlements: SubscriptionEntitlements) => {
    setEntitlements(nextEntitlements);
  }, []);

  return {
    entitlements,
    loading,
    checkoutLoading: checkoutState === "loading",
    billingLoading: billingState === "loading",
    refreshEntitlements,
    startCheckout,
    openBillingPortal,
    applyVoiceUsage,
    syncEntitlements,
  };
}
