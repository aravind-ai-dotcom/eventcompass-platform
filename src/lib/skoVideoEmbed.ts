// IBM Media Center + YouTube embed helpers for Explore SKO

export function extractMediaCenterEntryId(url: string): string | null {
  const match = url.match(/\/(1_[a-z0-9]+)/i);
  return match?.[1] ?? null;
}

export function mediaCenterEmbedUrl(url: string): string | null {
  const entryId = extractMediaCenterEntryId(url);
  if (!entryId) return null;
  return `https://mediacenter.ibm.com/embed/secure/iframe/entryId/${entryId}`;
}

export function extractYoutubeId(url: string): string | null {
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watch) return watch[1];
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  return short?.[1] ?? null;
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
}

export type SkoVideoSource = {
  provider: "media_center" | "youtube" | "none";
  embedUrl: string | null;
  openUrl: string;
  label: string;
};

export function resolveSkoVideoSource(
  mediaCenterUrl?: string,
  fallbackYoutubeUrl?: string,
  videoProvider?: string,
): SkoVideoSource {
  const preferMedia =
    videoProvider === "media_center" || Boolean(mediaCenterUrl && videoProvider !== "youtube");

  if (preferMedia && mediaCenterUrl) {
    const embedUrl = mediaCenterEmbedUrl(mediaCenterUrl);
    return {
      provider: "media_center",
      embedUrl,
      openUrl: mediaCenterUrl,
      label: "IBM Media Center",
    };
  }

  if (fallbackYoutubeUrl) {
    return {
      provider: "youtube",
      embedUrl: youtubeEmbedUrl(fallbackYoutubeUrl),
      openUrl: fallbackYoutubeUrl,
      label: "YouTube",
    };
  }

  if (mediaCenterUrl) {
    const embedUrl = mediaCenterEmbedUrl(mediaCenterUrl);
    return {
      provider: "media_center",
      embedUrl,
      openUrl: mediaCenterUrl,
      label: "IBM Media Center",
    };
  }

  return { provider: "none", embedUrl: null, openUrl: "", label: "No video" };
}
