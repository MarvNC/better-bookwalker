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
  const [bookApiResponse, bookInfoFromScrape] = await Promise.all([
    fetchBookApi(UUID, getCache),
    fetchBookScrape(UUID, getCache),
  ]);
  // Preprocess
  const date = getDate(bookInfoFromScrape);
  const seriesIndex = processSeriesIndex(bookApiResponse.seriesNo);
  return {
    label: bookApiResponse.labelName,
    publisher: bookInfoFromScrape.publisher,
    pageCount: bookInfoFromScrape.pageCount,
    date,
    // API
    uuid: bookApiResponse.uuid,
    title: bookApiResponse.productName,
    titleKana: bookApiResponse.productNameKana,
    authors: bookApiResponse.authors,
    seriesId: bookApiResponse.seriesId,
    seriesIndex,
    detailsShort: bookApiResponse.productExplanationShort,
    details: bookApiResponse.productExplanationDetails,
    thumbnailImageUrl: bookApiResponse.thumbnailImageUrl,
    coverImageUrl: bookApiResponse.coverImageUrl,
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
