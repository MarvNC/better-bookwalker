import { GM, GmXhrRequest } from "$";

export async function cachedFetch(url: string) {
  const key = `fetch_${url}`;
  const cached = await getCached(key);
  if (cached) return cached;

  GM.xmlHttpRequest({
    method: "GET",
    url: url,
    onload: async (response) => {
      if (response.status !== 200) throw new Error("Failed to fetch");
      const json = JSON.parse(response.response);
      GM.setValue(key, json);
      return json;
    },
    onerror: (response) => {
      throw new Error("Failed to fetch");
    },
  });
}

export async function fetch(url: string) {
  GM.xmlHttpRequest({
    method: "GET",
    url: url,
    onload: async (response) => {
      if (response.status !== 200) throw new Error("Failed to fetch");
      const json = JSON.parse(response.response);
      return json;
    },
    onerror: (response) => {
      throw new Error("Failed to fetch");
    },
  });
}

export async function getCached(key: string) {
  const cached = await GM.getValue(key, null);
  if (typeof cached === "object") return cached as any;
  else if (typeof cached === "string") return JSON.parse(cached);
  else if (cached) throw new Error("Invalid cached value");
  return null;
}
