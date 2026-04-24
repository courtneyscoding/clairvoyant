import { supabase } from "@/integrations/supabase/client";
import { getApiUrl } from "@/lib/api";

export const getAccessToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
};

export const buildAuthorizedHeaders = async (headers?: HeadersInit) => {
  const nextHeaders = new Headers(headers);
  const accessToken = await getAccessToken();

  if (accessToken) {
    nextHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  return nextHeaders;
};

export const authorizedApiFetch = async (path: string, init: RequestInit = {}) => {
  const headers = await buildAuthorizedHeaders(init.headers);

  return fetch(getApiUrl(path), {
    ...init,
    headers,
  });
};
