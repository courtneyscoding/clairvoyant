const tarotArtModules = import.meta.glob("../assets/tarot-rws/*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export const tarotArt = Object.fromEntries(
  Object.entries(tarotArtModules).map(([path, imageUrl]) => {
    const fileName = path.split("/").pop()?.replace(".jpg", "") ?? path;
    return [fileName, imageUrl];
  }),
);
