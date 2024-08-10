import { GM, GmXhrRequest } from "$";

export async function cachedFetch(url: string) {
  return new Promise(async (resolve, reject) => {
    const key = `fetch_${url}`;
    const cached = await getCached(key);
    if (cached) {
      console.log(`Hit cache for ${url}`);
      resolve(cached);
      return;
    }

    console.log(`Fetching ${url}`);

    GM.xmlHttpRequest({
      method: "GET",
      url: url,
      onload: async (response) => {
        if (response.status !== 200) throw new Error("Failed to fetch");
        const json = JSON.parse(response.response);
        GM.setValue(key, json);
        resolve(json);
      },
      onerror: (response) => {
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
    onerror: (response) => {
      throw new Error("Failed to fetch");
    },
  });
}

export async function fetchDocument(url: string): Promise<Document> {
  console.log(`Fetching document for ${url}`);
  return new Promise(async (resolve, reject) => {
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
      onerror: (response) => {
        reject(new Error("Failed to fetch"));
      },
    });
  });
}

export async function getCached(key: string) {
  const cached = await GM.getValue(key, null);
  if (typeof cached === "object") return cached as any;
  else if (typeof cached === "string") return JSON.parse(cached);
  else if (cached) throw new Error("Invalid cached value");
  return null;
}
