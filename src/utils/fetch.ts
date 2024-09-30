import { GM } from "$";

export async function fetch(
  url: string,
  getCache: boolean = true,
): Promise<{ unknownResponse: unknown; wasCached: boolean }> {
  const key = `fetch_${url}`;

  if (getCache) {
    const cached = await getCachedObject(key);
    if (cached) {
      return { unknownResponse: cached, wasCached: true };
    }
  }

  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "GET",
      onerror: () => {
        reject(new Error("Failed to fetch"));
      },
      onload: async (response) => {
        if (response.status !== 200) {
          reject(new Error("Failed to fetch"));
          return;
        }
        const json = JSON.parse(response.response);
        await GM.setValue(key, json);
        resolve({ unknownResponse: json, wasCached: false });
      },
      url,
    });
  });
}

export async function fetchDocument(url: string): Promise<{
  document: Document;
  finalUrl: string;
}> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "GET",
      onerror: () => {
        reject(new Error("Failed to fetch"));
      },
      onload: async (response) => {
        if (response.status !== 200) throw new Error("Failed to fetch");
        const document = new DOMParser().parseFromString(
          response.response,
          "text/html",
        );
        resolve({ document, finalUrl: response.finalUrl });
      },
      url,
    });
  });
}

export async function getCachedObject(key: string): Promise<null | unknown> {
  const cached = await GM.getValue(key, null);
  if (typeof cached === "object") return cached as unknown;
  else if (typeof cached === "string") return JSON.parse(cached);
  else if (cached) throw new Error("Invalid cached value");
  return null;
}
