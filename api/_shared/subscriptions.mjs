import Stripe from "stripe";

export const FREE_PLAN_KEY = "free";
export const SEEKER_PLAN_KEY = "seeker";
export const ORACLE_PLAN_KEY = "oracle";
export const SEEKER_VOICE_SECONDS_LIMIT = 30 * 60;
export const ACTIVE_ACCESS_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "canceled"]);
const NON_ACCESS_STATUSES = new Set(["incomplete", "incomplete_expired", "paused"]);
const STRIPE_API_VERSION = "2026-02-25.clover";

let stripeClient;

const trimOrNull = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
};

export const getAppUrl = () =>
  trimOrNull(process.env.APP_URL) || "https://www.clairvoyantcourtney.com";

export const getStripeClient = () => {
  if (!stripeClient) {
    const apiKey = trimOrNull(process.env.STRIPE_SECRET_KEY);

    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    stripeClient = new Stripe(apiKey, {
      apiVersion: STRIPE_API_VERSION,
    });
  }

  return stripeClient;
};

export const getStripeWebhookSecret = () => {
  const secret = trimOrNull(process.env.STRIPE_WEBHOOK_SECRET);

  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return secret;
};

export const getStripePriceIdForPlan = (planKey) => {
  if (planKey === SEEKER_PLAN_KEY) {
    const priceId = trimOrNull(process.env.STRIPE_PRICE_SEEKER_MONTHLY);

    if (!priceId) {
      throw new Error("STRIPE_PRICE_SEEKER_MONTHLY is not configured");
    }

    return priceId;
  }

  if (planKey === ORACLE_PLAN_KEY) {
    const priceId = trimOrNull(process.env.STRIPE_PRICE_ORACLE_MONTHLY);

    if (!priceId) {
      throw new Error("STRIPE_PRICE_ORACLE_MONTHLY is not configured");
    }

    return priceId;
  }

  throw new Error(`Unsupported plan key: ${planKey}`);
};

export const getPlanKeyForPriceId = (priceId) => {
  if (!priceId) {
    return FREE_PLAN_KEY;
  }

  if (priceId === trimOrNull(process.env.STRIPE_PRICE_SEEKER_MONTHLY)) {
    return SEEKER_PLAN_KEY;
  }

  if (priceId === trimOrNull(process.env.STRIPE_PRICE_ORACLE_MONTHLY)) {
    return ORACLE_PLAN_KEY;
  }

  return FREE_PLAN_KEY;
};

export const getPlanSnapshot = (planKey) => {
  switch (planKey) {
    case SEEKER_PLAN_KEY:
      return {
        planKey,
        planName: "Seeker",
        voiceSecondsLimit: SEEKER_VOICE_SECONDS_LIMIT,
        voiceUnlimited: false,
      };
    case ORACLE_PLAN_KEY:
      return {
        planKey,
        planName: "Oracle",
        voiceSecondsLimit: null,
        voiceUnlimited: true,
      };
    default:
      return {
        planKey: FREE_PLAN_KEY,
        planName: "Free",
        voiceSecondsLimit: 0,
        voiceUnlimited: false,
      };
  }
};

export const getFreeEntitlements = () => {
  const snapshot = getPlanSnapshot(FREE_PLAN_KEY);

  return {
    ...snapshot,
    status: "free",
    hasPaidPlan: false,
    isFree: true,
    canUseVoice: false,
    voiceSecondsUsed: 0,
    voiceSecondsRemaining: 0,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
};

const getPeriodEndMs = (value) => {
  const timestamp = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const hasSubscriptionAccess = (status, currentPeriodEnd) => {
  const periodEndMs = getPeriodEndMs(currentPeriodEnd);

  if (!periodEndMs || periodEndMs <= Date.now()) {
    return false;
  }

  if (NON_ACCESS_STATUSES.has(status)) {
    return false;
  }

  return ACTIVE_ACCESS_STATUSES.has(status);
};

export const buildEntitlementsFromRow = (row) => {
  if (!row) {
    return getFreeEntitlements();
  }

  const rawPlanKey = row.plan_key || FREE_PLAN_KEY;
  const activeAccess = rawPlanKey !== FREE_PLAN_KEY && hasSubscriptionAccess(row.status, row.current_period_end);
  const effectivePlanKey = activeAccess ? rawPlanKey : FREE_PLAN_KEY;
  const snapshot = getPlanSnapshot(effectivePlanKey);
  const voiceSecondsUsed = activeAccess ? Math.max(0, Number(row.voice_seconds_used || 0)) : 0;
  const voiceSecondsLimit =
    snapshot.voiceSecondsLimit === null
      ? null
      : Math.max(0, Number(row.voice_seconds_limit ?? snapshot.voiceSecondsLimit));
  const voiceSecondsRemaining =
    voiceSecondsLimit === null ? null : Math.max(0, voiceSecondsLimit - voiceSecondsUsed);

  return {
    ...snapshot,
    status: typeof row.status === "string" ? row.status : "free",
    hasPaidPlan: activeAccess,
    isFree: effectivePlanKey === FREE_PLAN_KEY,
    canUseVoice: activeAccess && (snapshot.voiceUnlimited || (voiceSecondsRemaining ?? 0) > 0),
    voiceSecondsUsed,
    voiceSecondsRemaining,
    currentPeriodEnd: activeAccess ? row.current_period_end ?? null : null,
    cancelAtPeriodEnd: Boolean(activeAccess && row.cancel_at_period_end),
  };
};

export const getSubscriptionRowForUser = async (adminClient, userId) => {
  const { data, error } = await adminClient
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const getSubscriptionRowByCustomerId = async (adminClient, customerId) => {
  if (!customerId) {
    return null;
  }

  const { data, error } = await adminClient
    .from("user_subscriptions")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const getSubscriptionRowByStripeSubscriptionId = async (adminClient, subscriptionId) => {
  if (!subscriptionId) {
    return null;
  }

  const { data, error } = await adminClient
    .from("user_subscriptions")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const upsertSubscriptionRow = async (adminClient, values) => {
  const { error } = await adminClient.from("user_subscriptions").upsert(values, {
    onConflict: "user_id",
  });

  if (error) {
    throw error;
  }
};

export const ensureStripeCustomerForUser = async (adminClient, stripe, user) => {
  const existingRow = await getSubscriptionRowForUser(adminClient, user.id);

  if (existingRow?.stripe_customer_id) {
    return {
      customerId: existingRow.stripe_customer_id,
      subscriptionRow: existingRow,
    };
  }

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: {
      user_id: user.id,
    },
  });

  await upsertSubscriptionRow(adminClient, {
    user_id: user.id,
    stripe_customer_id: customer.id,
    plan_key: existingRow?.plan_key ?? FREE_PLAN_KEY,
    status: existingRow?.status ?? "free",
    current_period_start: existingRow?.current_period_start ?? null,
    current_period_end: existingRow?.current_period_end ?? null,
    cancel_at_period_end: existingRow?.cancel_at_period_end ?? false,
    voice_seconds_limit: existingRow?.voice_seconds_limit ?? 0,
    voice_seconds_used: existingRow?.voice_seconds_used ?? 0,
    updated_at: new Date().toISOString(),
  });

  return {
    customerId: customer.id,
    subscriptionRow: existingRow,
  };
};

const toIsoOrNull = (unixSeconds) =>
  typeof unixSeconds === "number" && Number.isFinite(unixSeconds)
    ? new Date(unixSeconds * 1000).toISOString()
    : null;

const getSubscriptionPriceId = (subscription) =>
  subscription.items?.data?.[0]?.price?.id || null;

const shouldKeepPaidPlan = (status, currentPeriodEnd) => hasSubscriptionAccess(status, currentPeriodEnd);

const resolveUserIdForSubscription = async (adminClient, stripe, subscription) => {
  const metadataUserId = trimOrNull(subscription.metadata?.user_id);

  if (metadataUserId) {
    return metadataUserId;
  }

  const existingBySubscriptionId = await getSubscriptionRowByStripeSubscriptionId(adminClient, subscription.id);

  if (existingBySubscriptionId?.user_id) {
    return existingBySubscriptionId.user_id;
  }

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

  const existingByCustomerId = await getSubscriptionRowByCustomerId(adminClient, customerId);

  if (existingByCustomerId?.user_id) {
    return existingByCustomerId.user_id;
  }

  if (!customerId) {
    return null;
  }

  const customer = await stripe.customers.retrieve(customerId);

  if (!customer || customer.deleted) {
    return null;
  }

  return trimOrNull(customer.metadata?.user_id);
};

export const syncSubscriptionFromStripe = async (adminClient, stripe, subscription, options = {}) => {
  const { resetVoiceUsage = false } = options;
  const userId = await resolveUserIdForSubscription(adminClient, stripe, subscription);

  if (!userId) {
    return null;
  }

  const existingRow =
    (await getSubscriptionRowForUser(adminClient, userId)) ||
    (await getSubscriptionRowByStripeSubscriptionId(adminClient, subscription.id));
  const priceId = getSubscriptionPriceId(subscription);
  const mappedPlanKey = getPlanKeyForPriceId(priceId);
  const currentPeriodStart = toIsoOrNull(subscription.current_period_start);
  const currentPeriodEnd = toIsoOrNull(subscription.current_period_end);
  const keepPaidPlan = mappedPlanKey !== FREE_PLAN_KEY && shouldKeepPaidPlan(subscription.status, currentPeriodEnd);
  const nextPlanKey = keepPaidPlan ? mappedPlanKey : FREE_PLAN_KEY;
  const nextVoiceLimit = nextPlanKey === SEEKER_PLAN_KEY ? SEEKER_VOICE_SECONDS_LIMIT : nextPlanKey === ORACLE_PLAN_KEY ? null : 0;

  let voiceSecondsUsed = Number(existingRow?.voice_seconds_used || 0);

  if (nextPlanKey === FREE_PLAN_KEY || resetVoiceUsage || existingRow?.plan_key !== nextPlanKey) {
    voiceSecondsUsed = 0;
  }

  await upsertSubscriptionRow(adminClient, {
    user_id: userId,
    stripe_customer_id:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? existingRow?.stripe_customer_id ?? null,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_key: nextPlanKey,
    status: subscription.status,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    voice_seconds_limit: nextVoiceLimit,
    voice_seconds_used: voiceSecondsUsed,
    updated_at: new Date().toISOString(),
  });

  return getSubscriptionRowForUser(adminClient, userId);
};

export const createBillingPortalSession = async (stripe, customerId) => {
  if (!customerId) {
    const error = new Error("No billing profile was found for this account");
    error.status = 400;
    error.code = "billing_profile_missing";
    throw error;
  }

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/plans`,
  });
};
