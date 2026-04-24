import { supabase } from "@/integrations/supabase/client";

const AUTH_RETURN_TO_KEY = "clairvoyant-courtney:return-to";
const LEGACY_HOST_FRAGMENT = "netlify.app";

const normalizeReturnTo = (value?: string | null) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.startsWith("/") && !trimmedValue.startsWith("//")) {
    return trimmedValue;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedValue, window.location.origin);

    if (parsedUrl.origin !== window.location.origin) {
      return null;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return null;
  }
};

export const rememberReturnTo = (path: string) => {
  if (typeof window === "undefined") return;

  const normalizedPath = normalizeReturnTo(path);

  if (!normalizedPath) {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return;
  }

  window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, normalizedPath);
};

export const peekReturnTo = () => {
  if (typeof window === "undefined") return null;

  return normalizeReturnTo(window.sessionStorage.getItem(AUTH_RETURN_TO_KEY));
};

export const consumeReturnTo = () => {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY);
  window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);

  return normalizeReturnTo(value);
};

export const purgeLegacyRedirectState = () => {
  if (typeof window === "undefined") return;

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);

      if (!key) continue;

      const value = storage.getItem(key);
      const normalizedValue = typeof value === "string" ? value.toLowerCase() : "";
      const normalizedKey = key.toLowerCase();

      if (
        normalizedKey.includes(LEGACY_HOST_FRAGMENT) ||
        normalizedValue.includes(LEGACY_HOST_FRAGMENT)
      ) {
        storage.removeItem(key);
      }
    }
  });

  const currentReturnTo = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY);

  if (currentReturnTo && currentReturnTo.toLowerCase().includes(LEGACY_HOST_FRAGMENT)) {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  }
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
