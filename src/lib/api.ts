const PROD_ORIGIN = "https://www.clairvoyantcourtney.com";

export const getApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window === "undefined") {
    return normalizedPath;
  }

  const configuredOrigin = import.meta.env.VITE_API_ORIGIN?.trim();

  if (configuredOrigin) {
    return `${configuredOrigin}${normalizedPath}`;
  }

  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  if (import.meta.env.DEV && isLocalhost && window.location.port && window.location.port !== "5173") {
    return `http://localhost:5173${normalizedPath}`;
  }

  if (import.meta.env.DEV) {
    return normalizedPath;
  }

  return isLocalhost ? `${PROD_ORIGIN}${normalizedPath}` : normalizedPath;
};
