type UUID = string;

export type pubDates = {
  end: Date | undefined;
  start: Date | undefined;
};

export type SeriesInfo = {
  authors: Author[];
  bookUUIDs: UUID[];
  dates: pubDates;
  label: string;
  publisher: string;
  seriesId: number;
  seriesName: string;
  seriesNameKana: string;
  synopsis: string;
  updateDate: string;
};

export type SeriesInfoApiResponse = {
  series_info: {
    deliveryServiceType: string[];
    iOSNG: number;
    is_wauri: boolean;
    message: null | string;
    moral_type_code: string;
    product_name_kana: string;
    productName: string;
    productPrice: number;
    saleEndTime: null | string;
    series_no: number;
    thumbnail_id: string;
    uuid: string;
  }[];
  update_date: string;
};

export type BookInfoFromScrape = {
  label: string;
  pageCount: number;
  publisher: string;
  startDateDigital: string | undefined;
  startDatePrint: string | undefined;
};

export type ProcessedBookInfo = {
  authors: Author[];
  coverImageUrl: string;
  date: Date;
  details: string;
  detailsShort: string;
  seriesId: number;
  seriesIndex: number;
  thumbnailImageUrl: string;
  title: string;
  titleKana: string;
  uuid: string;
} & Omit<BookInfoFromScrape, "startDateDigital" | "startDatePrint">;

export type Author = {
  authorName: string;
  authorNameKana: string;
  authorTypeName: string;
};

export type BookApiSingleBook = {
  authors: Author[];
  bvAudioVisualTypeCode: string;
  bvFileVersion: number;
  bvOpenFlag: number;
  categoryId: number;
  categoryName: string;
  comicFlag: boolean;
  companyName: string;
  copyRightString: string;
  coverImageUrl: string;
  drmTimeLimit: null | string;
  fileVersion: number;
  labelId: number;
  labelName: string;
  licenceUnitUrl: string;
  moralTypeCode: string;
  omfFlag: boolean;
  pdfFileTypes: string[];
  productExplanationDetails: string;
  productExplanationShort: string;
  productId: number;
  productName: string;
  productNameKana: string;
  productTypeCode: string;
  productTypeName: string;
  productVersionDisp: null | string;
  productVersionSys: number;
  seriesId: number;
  seriesName: string;
  seriesNameKana: string;
  seriesNo: number;
  sharedExpandSize: null | number;
  sharedFileSize: null | number;
  sharedFileVersion: null | number;
  thumbnailImageUrl: string;
  twitterOutputFlag: boolean;
  uuid: string;
  versionupLimitTime: null | string;
};

export type BookApiResponse = BookApiSingleBook[];
