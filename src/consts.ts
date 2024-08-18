export const bookInfoApiKey = (UUID: string) => `bookInfoApi_${UUID}`;
export const bookInfoScrapeKey = (UUID: string) => `bookInfoScrape_${UUID}`;
export const bookInfoUrl = (UUID: string) =>
  `https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&${UUID}=0`;
export const bookPageUrl = (UUID: string) => `https://bookwalker.jp/de${UUID}/`;
export const seriesInfoUrl = (seriesId: number) =>
  `https://seriesinfo.bookwalker.jp/series_info_${seriesId}_v2.json`;

export const pageTypes: Record<pageType, { regex: RegExp }> = {
  series: { regex: /series\/(\d+)\// },
  book: { regex: /de[a-z0-9-]{36}\// },
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
  series = "series",
  book = "book",
}
