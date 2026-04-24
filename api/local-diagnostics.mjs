import { handleOptions, setCors } from "./_shared/cors.mjs";
import { createSupabaseAdminClient } from "./_shared/supabase.mjs";

const isLocalRequest = (req) => {
  const host = String(req.headers.host || "");
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
};

const getEnvShape = (name) => {
  const value = process.env[name]?.trim() || "";

  return {
    present: Boolean(value),
    prefix: value ? value.slice(0, value.indexOf("_") + 1 || Math.min(value.length, 6)) : null,
    length: value.length,
  };
};

const checkTable = async (admin, table) => {
  const { error } = await admin.from(table).select("id").limit(1);

  return {
    ok: !error,
    error: error?.message || null,
  };
};

export default async function handler(req, res) {
  setCors(res);

  if (handleOptions(req, res)) {
    return;
  }

  if (!isLocalRequest(req)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  try {
    const admin = createSupabaseAdminClient();

    res.status(200).json({
      env: {
        VITE_SUPABASE_URL: getEnvShape("VITE_SUPABASE_URL"),
        VITE_SUPABASE_PUBLISHABLE_KEY: getEnvShape("VITE_SUPABASE_PUBLISHABLE_KEY"),
        SUPABASE_SERVICE_ROLE_KEY: getEnvShape("SUPABASE_SERVICE_ROLE_KEY"),
        STRIPE_SECRET_KEY: getEnvShape("STRIPE_SECRET_KEY"),
        STRIPE_PRICE_SEEKER_MONTHLY: getEnvShape("STRIPE_PRICE_SEEKER_MONTHLY"),
        STRIPE_PRICE_ORACLE_MONTHLY: getEnvShape("STRIPE_PRICE_ORACLE_MONTHLY"),
        APP_URL: getEnvShape("APP_URL"),
      },
      tables: {
        user_subscriptions: await checkTable(admin, "user_subscriptions"),
        voice_usage_events: await checkTable(admin, "voice_usage_events"),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Diagnostics failed",
    });
  }
}
