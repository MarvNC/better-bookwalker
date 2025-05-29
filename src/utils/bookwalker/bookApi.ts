import { bookInfoApiKey, bookInfoScrapeKey, bookInfoUrl } from "@/consts";
import {
  BookApiResponse,
  BookApiSingleBook,
  BookInfoFromScrape,
  ProcessedBookInfo,
} from "@/types";
import { fetch, getCachedObject } from "@/utils/fetch";
import { getDate } from "@/utils/getMetaInfo";
import { processSeriesIndex } from "@/utils/processInfo";
import { scrapeBook } from "@/utils/scrape/scrapeBook";
import { GM } from "$";

export async function getMultipleBookInfo(
  UUIDs: string[],
): Promise<ProcessedBookInfo[]> {
  const books: ProcessedBookInfo[] = [];
  for (const uuid of UUIDs) {
    const bookInfo = await getSingleBookInfo(uuid);
    books.push(bookInfo);
  }
  return books;
}

export async function getSingleBookInfo(
  UUID: string,
  getCache: boolean = true,
): Promise<ProcessedBookInfo> {
  let bookApiResponse: BookApiSingleBook;
  try {
    bookApiResponse = await fetchBookApi(UUID, getCache);
  } catch (error) {
    console.error(`Failed to fetch book API for UUID: ${UUID}`, error);
    bookApiResponse = {
      authors: [],
      bvAudioVisualTypeCode: "",
      bvFileVersion: 0,
      bvOpenFlag: 0,
      categoryId: 0,
      categoryName: "",
      comicFlag: false,
      companyName: "",
      copyRightString: "",
      coverImageUrl: "",
      drmTimeLimit: null,
      fileVersion: 0,
      labelId: 0,
      labelName: "Unknown Label",
      licenceUnitUrl: "",
      moralTypeCode: "",
      omfFlag: false,
      pdfFileTypes: [],
      productExplanationDetails: "Details not available.",
      productExplanationShort: "Details not available.",
      productId: 0,
      productName: "Unknown Title",
      productNameKana: "",
      productTypeCode: "",
      productTypeName: "",
      productVersionDisp: null,
      productVersionSys: 0,
      seriesId: 0,
      seriesName: "Unknown Series",
      seriesNameKana: "",
      seriesNo: 0,
      sharedExpandSize: null,
      sharedFileSize: null,
      sharedFileVersion: null,
      thumbnailImageUrl: "",
      twitterOutputFlag: false,
      uuid: UUID,
      versionupLimitTime: null,
    };
  }
  let bookInfoFromScrape: BookInfoFromScrape;
  try {
    bookInfoFromScrape = await fetchBookScrape(UUID, getCache);
  } catch (error) {
    console.error(`Failed to fetch book scrape for UUID: ${UUID}`, error);
    bookInfoFromScrape = {
      label: "Unknown Label",
      pageCount: 0,
      publisher: "Unknown Publisher",
      startDateDigital: undefined,
      startDatePrint: undefined,
    };
  }

  // Preprocess
  const date = getDate(bookInfoFromScrape);
  const seriesIndex = processSeriesIndex(bookApiResponse.seriesNo);

  return {
    authors: bookApiResponse.authors,
    coverImageUrl: bookApiResponse.coverImageUrl,
    date,
    details: bookApiResponse.productExplanationDetails,
    detailsShort: bookApiResponse.productExplanationShort,
    label: bookApiResponse.labelName,
    pageCount: bookInfoFromScrape.pageCount,
    publisher: bookInfoFromScrape.publisher,
    seriesId: bookApiResponse.seriesId,
    seriesIndex,
    thumbnailImageUrl: bookApiResponse.thumbnailImageUrl,
    title: bookApiResponse.productName,
    titleKana: bookApiResponse.productNameKana,
    uuid: bookApiResponse.uuid,
  };
}

export async function fetchBookApi(
  UUID: string,
  getCache: boolean = true,
): Promise<BookApiSingleBook> {
  if (getCache) {
    const cached = await getCachedObject(bookInfoApiKey(UUID));
    if (cached) return cached as BookApiSingleBook;
  }

  const { unknownResponse } = await fetch(bookInfoUrl(UUID));
  const response = unknownResponse as BookApiResponse;
  if (!response[0]?.productId) throw new Error("Invalid response");
  if (!response[0]?.productName) throw new Error("Invalid response");
  if (!response[0]?.uuid) throw new Error("Invalid response");
  GM.setValue(`bookInfo_${response[0].uuid}`, response[0]);
  return response[0];
}

export async function fetchBookScrape(
  UUID: string,
  getCache: boolean = true,
): Promise<BookInfoFromScrape> {
  if (getCache) {
    const cached = await getCachedObject(bookInfoScrapeKey(UUID));
    if (cached) return cached as BookInfoFromScrape;
  }

  const bookInfo = await scrapeBook(UUID);
  GM.setValue(bookInfoScrapeKey(UUID), bookInfo);
  return bookInfo;
}
