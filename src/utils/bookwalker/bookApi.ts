import { GM } from "$";
import {
  BookApiResponse,
  BookApiSingleBook,
  BookInfo,
  bookInfoApiKey,
  BookInfoFromScrape,
  bookInfoScrapeKey,
  bookInfoUrl,
} from "@/consts";
import { cachedFetch, getCached } from "@/utils/fetch";
import { scrapeBook } from "@/utils/bookwalker/scrapeBook";

export async function* getMultipleBookInfo(
  UUIDs: string[],
): AsyncGenerator<BookInfo> {
  for (const uuid of UUIDs) {
    const [bookApiResponse, bookInfoFromScrape] = await Promise.all([
      fetchBookApi(uuid),
      fetchBookScrape(uuid),
    ]);
    // TODO: preprocess here
    yield {
      uuid: bookApiResponse.uuid,
      title: bookApiResponse.productName,
      titleKana: bookApiResponse.productNameKana,
      authors: bookApiResponse.authors,
      seriesId: bookApiResponse.seriesId,
      seriesIndex: bookApiResponse.seriesNo,
      detailsShort: bookApiResponse.productExplanationShort,
      details: bookApiResponse.productExplanationDetails,
      thumbnailImageUrl: bookApiResponse.thumbnailImageUrl,
      coverImageUrl: bookApiResponse.coverImageUrl,
      ...bookInfoFromScrape,
    };
  }
}

export async function fetchBookApi(UUID: string): Promise<BookApiSingleBook> {
  const cached = await getCached(bookInfoApiKey(UUID));
  if (cached) return cached;

  const response = (await cachedFetch(bookInfoUrl(UUID))) as BookApiResponse;
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
