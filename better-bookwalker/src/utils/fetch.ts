import { GM } from "$";

export async function cachedFetch(url: string) {
  const key = `fetch_${url}`;
  const cached = await GM.getValue(key, null);
  if (cached) return JSON.parse(cached);
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch");
  const json = await response.json();
  GM.setValue(key, JSON.stringify(json));
  return json;
}
