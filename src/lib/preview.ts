const localPreviewEnabled = import.meta.env.VITE_ENABLE_LOCAL_PREVIEW === "true";

export const isLocalPreview =
  localPreviewEnabled &&
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const previewUser = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "preview@local.test",
};
