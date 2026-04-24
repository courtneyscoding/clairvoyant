import { handleOptions, readJsonBody, setCors } from "../_shared/cors.mjs";
import { createSupabaseAdminClient, requireSupabaseUser } from "../_shared/supabase.mjs";
import {
  buildEntitlementsFromRow,
  createBillingPortalSession,
  ensureStripeCustomerForUser,
  getAppUrl,
  getStripeClient,
  getStripePriceIdForPlan,
  getSubscriptionRowForUser,
  ORACLE_PLAN_KEY,
  SEEKER_PLAN_KEY,
} from "../_shared/subscriptions.mjs";

const ALLOWED_PLAN_KEYS = new Set([SEEKER_PLAN_KEY, ORACLE_PLAN_KEY]);

const sendError = (res, error) => {
  const status = Number(error?.status) || 500;
  console.error("Checkout session failed:", error);
  res.status(status).json({
    error: error instanceof Error ? error.message : "Unable to start checkout",
    code: error?.code || "checkout_error",
    details: error?.details || error?.hint || null,
  });
};

export default async function handler(req, res) {
  setCors(res, { allowAuthorization: true });

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { user } = await requireSupabaseUser(req);
    const body = await readJsonBody(req);
    const planKey = typeof body.planKey === "string" ? body.planKey.trim().toLowerCase() : "";

    if (!ALLOWED_PLAN_KEYS.has(planKey)) {
      res.status(400).json({ error: "A paid plan is required", code: "invalid_plan" });
      return;
    }

    const admin = createSupabaseAdminClient();
    const stripe = getStripeClient();
    const existingRow = await getSubscriptionRowForUser(admin, user.id);
    const entitlements = buildEntitlementsFromRow(existingRow);

    if (entitlements.hasPaidPlan && existingRow?.stripe_customer_id) {
      const portalSession = await createBillingPortalSession(stripe, existingRow.stripe_customer_id);

      res.status(200).json({
        mode: "portal",
        url: portalSession.url,
      });
      return;
    }

    const { customerId } = await ensureStripeCustomerForUser(admin, stripe, user);
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      success_url: `${getAppUrl()}/chat?checkout=success`,
      cancel_url: `${getAppUrl()}/plans?checkout=cancelled`,
      line_items: [
        {
          price: getStripePriceIdForPlan(planKey),
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        plan_key: planKey,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_key: planKey,
        },
      },
    });

    res.status(200).json({
      mode: "checkout",
      url: checkoutSession.url,
    });
  } catch (error) {
    sendError(res, error);
  }
}
