import { useEffect } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import CosmicBackground from "@/components/CosmicBackground";
import SiteHeader from "@/components/SiteHeader";
import { useSubscription } from "@/hooks/useSubscription";
import { BRAND_NAME } from "@/lib/brand";
import {
  PLAN_DEFINITIONS,
  formatSecondsAsMinutes,
  type PlanDefinition,
  type PlanKey,
} from "@/lib/subscriptions";

const Plans = () => {
  const {
    entitlements,
    loading,
    checkoutLoading,
    billingLoading,
    startCheckout,
    openBillingPortal,
  } = useSubscription();

  useEffect(() => {
    document.title = `Plans - ${BRAND_NAME}`;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get("checkout");

    if (checkoutState === "cancelled") {
      toast.message("Checkout was cancelled. Your plan did not change.");
    }
  }, []);

  const handlePlanAction = async (plan: PlanDefinition) => {
    try {
      if (plan.key === "free") {
        return;
      }

      if (entitlements.hasPaidPlan && entitlements.planKey === plan.key) {
        await openBillingPortal();
        return;
      }

      await startCheckout(plan.key);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open billing");
    }
  };

  const renderPlanActionLabel = (planKey: PlanKey) => {
    if (planKey === "free") {
      return entitlements.isFree ? "Current plan" : "Free tier";
    }

    if (entitlements.hasPaidPlan && entitlements.planKey === planKey) {
      return "Manage billing";
    }

    return PLAN_DEFINITIONS.find((plan) => plan.key === planKey)?.ctaLabel ?? "Continue";
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[hsl(270,72%,5%)] text-white">
      <CosmicBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(132,79,186,0.24),transparent_48%),linear-gradient(180deg,rgba(24,11,36,0.88),rgba(10,5,18,0.96))]" />

      <div className="relative z-[1] flex min-h-[100dvh] flex-col">
        <SiteHeader />

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
          <section className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.34em] text-[#d9c2ff]">Voice Plans</p>
            <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight text-[#f7f0ff] sm:text-6xl">
              Step Into Courtney&apos;s Voice
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#d4c4eb] sm:text-lg">
              Text readings stay free. Paid plans unlock Courtney&apos;s voice chat so the reading
              feels faster, warmer, and more alive.
            </p>
          </section>

          <section className="mt-8 rounded-[2rem] border border-[rgba(140,96,196,0.24)] bg-[rgba(34,17,50,0.58)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-6">
            <div className="flex flex-col gap-2 text-sm text-[#e9ddff] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#e0bcff]" />
                <span>
                  Current plan: <span className="font-semibold text-white">{entitlements.planName}</span>
                </span>
              </div>

              {!loading && entitlements.hasPaidPlan && entitlements.currentPeriodEnd && (
                <span className="text-[#cab4e9]">
                  {entitlements.voiceUnlimited
                    ? "Unlimited voice is active."
                    : `${formatSecondsAsMinutes(entitlements.voiceSecondsRemaining ?? 0)} left this cycle.`}
                </span>
              )}
            </div>

            {!loading && entitlements.cancelAtPeriodEnd && entitlements.currentPeriodEnd && (
              <p className="mt-3 text-sm text-[#e4b8cc]">
                Your current plan is set to end when this billing period closes.
              </p>
            )}
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-3">
            {PLAN_DEFINITIONS.map((plan) => {
              const isCurrentPlan =
                (plan.key === "free" && entitlements.isFree) ||
                (entitlements.hasPaidPlan && entitlements.planKey === plan.key);
              const isFeatured = plan.key === "oracle";

              return (
                <Card
                  key={plan.key}
                  className={`group relative overflow-hidden rounded-[2rem] border bg-[rgba(26,13,39,0.78)] text-white shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 ${
                    isFeatured
                      ? "border-[rgba(203,146,255,0.55)]"
                      : "border-[rgba(116,69,151,0.32)]"
                  }`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 ${
                      isFeatured
                        ? "bg-[linear-gradient(90deg,#f0ccff,#9f57ef,#69d8ff)]"
                        : "bg-[linear-gradient(90deg,rgba(196,150,255,0.3),rgba(159,87,239,0.85))]"
                    }`}
                  />
                  <CardHeader className="space-y-5 p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-[#d4c4eb]">{plan.name}</p>
                        <p className="mt-3 text-sm leading-7 text-[#cfbfe7]">{plan.summary}</p>
                      </div>

                      {plan.badge && (
                        <span className="rounded-full border border-[rgba(225,193,255,0.28)] bg-[rgba(255,255,255,0.08)] px-3 py-1 text-[0.72rem] uppercase tracking-[0.2em] text-[#f1d7ff]">
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="font-display text-5xl font-semibold tracking-tight text-[#fff8ff]">
                        {plan.priceLabel}
                      </div>
                      {isCurrentPlan && (
                        <p className="mt-2 text-sm font-medium text-[#efd5ff]">Current plan</p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex h-full flex-col px-7 pb-7 pt-0">
                    <ul className="space-y-4 text-sm leading-7 text-[#ebdefd]">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <span className="mt-1 rounded-full bg-[rgba(174,118,242,0.18)] p-1 text-[#efdaff]">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      type="button"
                      className={`mt-8 h-12 rounded-[1rem] text-sm font-semibold ${
                        plan.key === "free"
                          ? "bg-[rgba(73,45,101,0.56)] text-[#dac8ef] hover:bg-[rgba(73,45,101,0.56)]"
                          : "bg-[linear-gradient(135deg,#f0ccff,#9f57ef)] text-[#200b33] hover:opacity-95"
                      }`}
                      disabled={
                        loading ||
                        checkoutLoading ||
                        billingLoading ||
                        plan.key === "free"
                      }
                      onClick={() => void handlePlanAction(plan)}
                    >
                      {renderPlanActionLabel(plan.key)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Plans;
