export const pageTypes: Record<pageType, { regex: RegExp }> = {
  series: { regex: /series\/(\d+)\/list\// },
  book: { regex: /de[a-z0-9\-]{36}\// },
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

export type SeriesInfo = {
  seriesId: number;
  seriesName: string | null;
  seriesNameKana: string | null;
  books: UUID[];
  updateDate: string;
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

export type BookInfoFromApi = {
  uuid: string;
  title: string;
  titleKana: string;
  seriesIndex: number;
  detailsShort: string;
  details: string;
  thumbnailImageUrl: string;
  coverImageUrl: string;
  seriesId: number;
};

export type BookInfoFromScrape = {
  label: string;
  publisher: string;
  pageCount: number;
  startDateDigital: string;
  startDatePrint: string;
};

export type BookInfo = BookInfoFromApi & BookInfoFromScrape;

type Author = {
  authorTypeName: string;
  authorName: string;
  authorNameKana: string;
}[];

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
