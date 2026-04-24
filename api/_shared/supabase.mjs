import { createClient } from "@supabase/supabase-js";

let authClient;
let adminClient;

const getEnv = (name) => {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`${name} is not configured`);
  }

  return value.trim();
};

export const getSupabaseUrl = () =>
  process.env.VITE_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || getEnv("VITE_SUPABASE_URL");

export const getSupabasePublishableKey = () =>
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
  getEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

export const getSupabaseServiceRoleKey = () => getEnv("SUPABASE_SERVICE_ROLE_KEY");

export const createSupabaseAuthClient = () => {
  if (!authClient) {
    authClient = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return authClient;
};

export const createSupabaseAdminClient = () => {
  if (!adminClient) {
    adminClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
};

export const getBearerToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization;

  if (typeof header !== "string") {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

export const requireSupabaseUser = async (req) => {
  const token = getBearerToken(req);

  if (!token) {
    const error = new Error("Authentication is required");
    error.status = 401;
    error.code = "unauthorized";
    throw error;
  }

  const auth = createSupabaseAuthClient();
  const { data, error } = await auth.auth.getUser(token);

  if (error || !data.user) {
    const authError = new Error("Authentication is required");
    authError.status = 401;
    authError.code = "unauthorized";
    throw authError;
  }

  return {
    accessToken: token,
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
  };
};
