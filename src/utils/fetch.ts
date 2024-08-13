import { GM } from "$";

export async function fetch(
  url: string,
  getCache: boolean = true,
): Promise<{ wasCached: boolean; unknownResponse: unknown }> {
  const key = `fetch_${url}`;

  if (getCache) {
    const cached = await getCached(key);
    if (cached) {
      return { wasCached: true, unknownResponse: cached };
    }
  }

  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "GET",
      url,
      onload: async (response) => {
        if (response.status !== 200) {
          reject(new Error("Failed to fetch"));
          return;
        }
        const json = JSON.parse(response.response);
        await GM.setValue(key, json);
        resolve({ wasCached: false, unknownResponse: json });
      },
      onerror: () => {
        reject(new Error("Failed to fetch"));
      },
    });
  });
}

export async function fetchDocument(url: string): Promise<Document> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "GET",
      url,
      onload: async (response) => {
        if (response.status !== 200) throw new Error("Failed to fetch");
        const document = new DOMParser().parseFromString(
          response.response,
          "text/html",
        );
        resolve(document);
      },
      onerror: () => {
        reject(new Error("Failed to fetch"));
      },
    });
  });
}

export async function getCached(key: string) {
  const cached = await GM.getValue(key, null);
  if (typeof cached === "object") return cached as unknown;
  else if (typeof cached === "string") return JSON.parse(cached);
  else if (cached) throw new Error("Invalid cached value");
  return null;
}
