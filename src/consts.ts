export const bookInfoApiKey = (UUID: string) => `bookInfoApi_${UUID}`;
export const bookInfoScrapeKey = (UUID: string) => `bookInfoScrape_${UUID}`;
export const bookInfoUrl = (UUID: string) =>
  `https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&${UUID}=0`;
export const bookPageUrl = (UUID: string) => `https://bookwalker.jp/de${UUID}/`;

// const multipleBookInfoUrl = (UUIDs: string[]) => {
//   return `https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&${UUIDs.map((UUID, index) => `${UUID}=${index}`).join("&")}`;
// };

export const pageTypes: Record<pageType, { regex: RegExp }> = {
  series: { regex: /series\/(\d+)\// },
  book: { regex: /de[a-z0-9-]{36}\// },
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

type UUID = string;

export type pubDates = {
  start: Date | undefined;
  end: Date | undefined;
};

export type SeriesInfo = {
  seriesId: number;
  seriesName: string;
  seriesNameKana: string;
  books: UUID[];
  updateDate: string;
  authors: Author[];
  label: string;
  publisher: string;
  dates: pubDates;
};

export type SeriesInfoApiResponse = {
  series_info: {
    uuid: string;
    thumbnail_id: string;
    product_name_kana: string;
    series_no: number;
    moral_type_code: string;
    deliveryServiceType: string[];
    iOSNG: number;
    message: string | null;
    is_wauri: boolean;
    productName: string;
    productPrice: number;
    saleEndTime: string | null;
  }[];
  update_date: string;
};

export type BookInfoFromScrape = {
  label: string;
  publisher: string;
  pageCount: number;
  startDateDigital: string | undefined;
  startDatePrint: string | undefined;
};

export type ProcessedBookInfo = Omit<
  BookInfoFromScrape,
  "startDateDigital" | "startDatePrint"
> & {
  uuid: string;
  title: string;
  titleKana: string;
  authors: Author[];
  seriesIndex: number;
  detailsShort: string;
  details: string;
  thumbnailImageUrl: string;
  coverImageUrl: string;
  seriesId: number;
  date: Date;
};

export type Author = {
  authorTypeName: string;
  authorName: string;
  authorNameKana: string;
};

export type BookApiSingleBook = {
  productId: number;
  productName: string;
  productNameKana: string;
  uuid: string;
  authors: Author[];
  moralTypeCode: string;
  companyName: string;
  copyRightString: string;
  productExplanationShort: string;
  productExplanationDetails: string;
  productTypeCode: string;
  productTypeName: string;
  thumbnailImageUrl: string;
  coverImageUrl: string;
  licenceUnitUrl: string;
  productVersionSys: number;
  productVersionDisp: string | null;
  fileVersion: number;
  pdfFileTypes: string[];
  twitterOutputFlag: boolean;
  drmTimeLimit: string | null;
  comicFlag: boolean;
  sharedFileSize: number | null;
  sharedExpandSize: number | null;
  sharedFileVersion: number | null;
  versionupLimitTime: string | null;
  omfFlag: boolean;
  labelId: number;
  labelName: string;
  seriesId: number;
  seriesName: string;
  seriesNameKana: string;
  seriesNo: number;
  categoryId: number;
  categoryName: string;
  bvFileVersion: number;
  bvAudioVisualTypeCode: string;
  bvOpenFlag: number;
};

export type BookApiResponse = BookApiSingleBook[];
