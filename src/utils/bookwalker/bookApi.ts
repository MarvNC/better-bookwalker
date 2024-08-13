import {
  BookApiResponse,
  BookApiSingleBook,
  bookInfoApiKey,
  BookInfoFromScrape,
  bookInfoScrapeKey,
  bookInfoUrl,
  ProcessedBookInfo,
} from "@/consts";
import { scrapeBook } from "@/utils/bookwalker/scrapeBook";
import { fetch, getCached } from "@/utils/fetch";
import { GM } from "$";

import { getDate } from "../getMetaInfo";
import { processSeriesIndex } from "../processInfo";

export async function* getMultipleBookInfo(
  UUIDs: string[],
): AsyncGenerator<ProcessedBookInfo> {
  for (const uuid of UUIDs) {
    const processedBookInfo = await getSingleBookInfo(uuid);
    yield processedBookInfo;
  }
}

export async function getSingleBookInfo(
  UUID: string,
): Promise<ProcessedBookInfo> {
  const [bookApiResponse, bookInfoFromScrape] = await Promise.all([
    fetchBookApi(UUID),
    fetchBookScrape(UUID),
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

export async function fetchBookApi(UUID: string): Promise<BookApiSingleBook> {
  const cached = await getCached(bookInfoApiKey(UUID));
  if (cached) return cached;

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
): Promise<BookInfoFromScrape> {
  const cached = await getCached(bookInfoScrapeKey(UUID));
  if (cached) return cached;

  const bookInfo = await scrapeBook(UUID);
  GM.setValue(bookInfoScrapeKey(UUID), bookInfo);
  return bookInfo;
}
