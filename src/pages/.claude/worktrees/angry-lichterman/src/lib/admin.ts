import { supabase } from "@/integrations/supabase/client";

const AUTH_RETURN_TO_KEY = "clairvoyant-courtney:return-to";

export const rememberReturnTo = (path: string) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, path);
};

export const peekReturnTo = () => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(AUTH_RETURN_TO_KEY);
};

export const consumeReturnTo = () => {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY);
  if (value) {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  }

  return value;
};

export const getAdminAccess = async (email?: string | null) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return {
      allowed: false,
      error: null as string | null,
    };
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  return {
    allowed: Boolean(data && !error),
    error: error?.message || null,
  };
};
