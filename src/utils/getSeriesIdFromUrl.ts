import { seriesIdRegex } from "@/consts";

export function getSeriesIdFromUrl(pageUrl = window.location.href): number {
  console.log(`Fetching series info for ${pageUrl}`);
  const url = new URL(pageUrl);
  const match = url.pathname.match(seriesIdRegex);
  if (!match) throw new Error("Invalid URL");
  const seriesId = parseInt(match[1]);
  return seriesId;
}
