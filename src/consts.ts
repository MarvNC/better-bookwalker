export const bookInfoApiKey = (UUID: string) => `bookInfoApi_${UUID}`;
export const bookInfoScrapeKey = (UUID: string) => `bookInfoScrape_${UUID}`;
export const bookInfoUsKey = (UUID: string) => `bookInfoUs_${UUID}`;
export const bookInfoUrl = (UUID: string) =>
  `https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&${UUID}=0`;
export const bookPageUrl = (UUID: string) => `https://bookwalker.jp/de${UUID}/`;
export const bookwalkerJpSearchQuery = (title: string) => {
  const withoutEditionSuffix = title
    .replace(/\s*[（(][^（）()]*[）)]\s*$/u, "")
    .trim();
  const shortTitle = withoutEditionSuffix.split(/\s*[～〜]\s*/u)[0]?.trim();
  return shortTitle && shortTitle.length >= 3
    ? shortTitle
    : withoutEditionSuffix || title;
};
export const bookwalkerJpSearchUrl = (title: string) =>
  `https://bookwalker.jp/search/?word=${encodeURIComponent(bookwalkerJpSearchQuery(title))}`;
export const globalSeriesDetailsUrl = () =>
  "https://bookwalker.com/api/kyon/kyon.v1.ContentService/Details";
export const seriesInfoUrl = (seriesId: number) =>
  `https://seriesinfo.bookwalker.jp/series_info_${seriesId}_v2.json`;

export const pageTypes: Record<pageType, { regex: RegExp }> = {
  book: { regex: /de[a-z0-9-]{36}\// },
  series: { regex: /\/series\/(?:\d+|[A-Z0-9]{12})(?:\/|$)/i },
};

export const storeTypes: Record<storeType, { regex: RegExp }> = {
  bw: { regex: /^https?:\/\/bookwalker\.jp/ },
  bwg: { regex: /^https?:\/\/global\.bookwalker\.jp/ },
  r18: { regex: /^https?:\/\/r18\.bookwalker\.jp/ },
};

export enum storeType {
  bw = "bw",
  bwg = "bwg",
  r18 = "r18",
}

export enum pageType {
  book = "book",
  series = "series",
}

export const seriesIdRegex = /\/series\/(\d+)\//;
