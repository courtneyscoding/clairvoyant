export const isLocalPreview =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const previewUser = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "preview@local.test",
  isAdmin: true,
};
