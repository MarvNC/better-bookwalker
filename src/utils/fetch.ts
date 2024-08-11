import { GM } from "$";

export async function cachedFetch(url: string): Promise<unknown> {
  const key = `fetch_${url}`;
  const cached = await getCached(key);
  if (cached) {
    console.log(`Hit cache for ${url}`);
    return cached;
  }

  console.log(`Fetching ${url}`);
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "GET",
      url: url,
      onload: async (response) => {
        if (response.status !== 200) throw new Error("Failed to fetch");
        const json = JSON.parse(response.response);
        GM.setValue(key, json);
        resolve(json);
      },
      onerror: () => {
        reject(new Error("Failed to fetch"));
      },
    });
  });
}

export async function fetch(url: string) {
  console.log(`Fetching ${url}`);
  GM.xmlHttpRequest({
    method: "GET",
    url: url,
    onload: async (response) => {
      if (response.status !== 200) throw new Error("Failed to fetch");
      const json = JSON.parse(response.response);
      return json;
    },
    onerror: () => {
      throw new Error("Failed to fetch");
    },
  });
}

export async function fetchDocument(url: string): Promise<Document> {
  console.log(`Fetching document for ${url}`);
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "GET",
      url: url,
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
