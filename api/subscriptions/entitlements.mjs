import { handleOptions, readJsonBody, setCors } from "../_shared/cors.mjs";
import { createSupabaseAdminClient, requireSupabaseUser } from "../_shared/supabase.mjs";
import { buildEntitlementsFromRow, getSubscriptionRowForUser } from "../_shared/subscriptions.mjs";

const sendError = (res, error) => {
  const status = Number(error?.status) || 500;
  console.error("Entitlements lookup failed:", error);
  res.status(status).json({
    error: error instanceof Error ? error.message : "Unable to load subscription access",
    code: error?.code || "subscription_error",
    details: error?.details || error?.hint || null,
  });
};

export default async function handler(req, res) {
  setCors(res, { allowAuthorization: true });

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const {
      user: { id: userId },
    } = await requireSupabaseUser(req);
    const admin = createSupabaseAdminClient();
    const subscriptionRow = await getSubscriptionRowForUser(admin, userId);

    res.status(200).json({
      entitlements: buildEntitlementsFromRow(subscriptionRow),
    });
  } catch (error) {
    sendError(res, error);
  }
}
