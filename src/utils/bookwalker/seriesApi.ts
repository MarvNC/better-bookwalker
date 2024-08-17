import { ProcessedBookInfo, SeriesInfo, SeriesInfoApiResponse } from "@/consts";
import {
  fetchBookApi,
  getMultipleBookInfo,
  getSingleBookInfo,
} from "@/utils/bookwalker/bookApi";
import { fetch } from "@/utils/fetch";

import { getAuthors, getDates, getLabel, getPublisher } from "../getMetaInfo";

const seriesInfoUrl = (seriesId: number) =>
  `https://seriesinfo.bookwalker.jp/series_info_${seriesId}_v2.json`;

type SetSeriesCallback = (series: SeriesInfo) => void;
type SetBooksCallback = (books: ProcessedBookInfo[]) => void;

export async function fetchSeries(
  seriesId: number,
  setSeries: SetSeriesCallback,
  setBooks: SetBooksCallback,
): Promise<void> {
  const { series, wasCached } = await createSeries(seriesId);
  setSeries(series);

  const books: ProcessedBookInfo[] = [];

  for (const bookUUID of series.bookUUIDs) {
    const bookInfo = await getSingleBookInfo(bookUUID);
    books.push(bookInfo);
    setBooks(books);
    updateSeriesInfo(series, books, setSeries);
    console.log(
      `Fetched ${books.length} books for series ${series.seriesName}: last fetched ${books[books.length - 1].title}`,
    );
  }

  if (!wasCached) {
    return;
  }
  // If the series was cached, refetch latest volumes

  const { series: newSeries } = await createSeries(seriesId, false);
  updateSeriesInfo(newSeries, books, setSeries);
  setSeries(series);

  // Refetch books released after a month ago
  const monthMs = 2592000000;
  const booksToFetchUUIDs = books
    .filter((book) => book.date.valueOf() > new Date().valueOf() - monthMs)
    .map((book) => book.uuid);

  for (const bookUUID of booksToFetchUUIDs) {
    const bookInfo = await getSingleBookInfo(bookUUID, false);
    console.log(`Refetching ${bookInfo.title}`);
    const newBookList = await getMultipleBookInfo(series.bookUUIDs);
    setBooks(newBookList);
    updateSeriesInfo(newSeries, newBookList, setSeries);
  }
}

async function createSeries(seriesId: number, getCache: boolean = true) {
  const { wasCached, response: seriesApiResponse } = await fetchSeriesApi(
    seriesId,
    getCache,
  );
  const booksUUIDs = seriesApiResponse.series_info.map((book) => book.uuid);
  const firstBookApiResponse = await fetchBookApi(booksUUIDs[0]);
  const series: SeriesInfo = {
    seriesId,
    seriesName: firstBookApiResponse.seriesName,
    seriesNameKana: firstBookApiResponse.seriesNameKana,
    bookUUIDs: booksUUIDs,
    updateDate: seriesApiResponse.update_date,
    authors: firstBookApiResponse.authors,
    label: firstBookApiResponse.labelName,
    publisher: "",
    dates: {
      start: undefined,
      end: undefined,
    },
  };
  return {
    series,
    wasCached,
  };
}

function updateSeriesInfo(
  series: SeriesInfo,
  books: ProcessedBookInfo[],
  setSeries: SetSeriesCallback,
) {
  series.dates = getDates(books);
  series.publisher = getPublisher(books);
  series.authors = getAuthors(books);
  series.label = getLabel(books);
  setSeries(series);
}

async function fetchSeriesApi(
  seriesId: number,
  getCache: boolean = true,
): Promise<{ wasCached: boolean; response: SeriesInfoApiResponse }> {
  const { wasCached, unknownResponse } = await fetch(
    seriesInfoUrl(seriesId),
    getCache,
  );
  const response = unknownResponse as SeriesInfoApiResponse;
  if (!response.series_info) throw new Error("Invalid response");
  if (!response.update_date) throw new Error("Invalid response");
  return { wasCached, response };
}
