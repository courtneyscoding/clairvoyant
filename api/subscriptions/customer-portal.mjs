import { handleOptions, setCors } from "../_shared/cors.mjs";
import { createSupabaseAdminClient, requireSupabaseUser } from "../_shared/supabase.mjs";
import {
  createBillingPortalSession,
  ensureStripeCustomerForUser,
  getStripeClient,
  getSubscriptionRowForUser,
} from "../_shared/subscriptions.mjs";

const sendError = (res, error) => {
  const status = Number(error?.status) || 500;
  console.error("Customer portal failed:", error);
  res.status(status).json({
    error: error instanceof Error ? error.message : "Unable to open billing",
    code: error?.code || "billing_error",
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
    const admin = createSupabaseAdminClient();
    const stripe = getStripeClient();
    const existingRow = await getSubscriptionRowForUser(admin, user.id);
    const customerId =
      existingRow?.stripe_customer_id ||
      (await ensureStripeCustomerForUser(admin, stripe, user)).customerId;
    const portalSession = await createBillingPortalSession(stripe, customerId);

    res.status(200).json({
      url: portalSession.url,
    });
  } catch (error) {
    sendError(res, error);
  }
}
