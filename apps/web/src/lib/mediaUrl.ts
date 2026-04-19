/** Resolve entry media URL for playback or download. */
export function mediaFullUrl(mediaUrl?: string | null): string {
  if (!mediaUrl) return "";
  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) return mediaUrl;
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
  return `${base.replace(/\/$/, "")}${mediaUrl.startsWith("/") ? "" : "/"}${mediaUrl}`;
}
