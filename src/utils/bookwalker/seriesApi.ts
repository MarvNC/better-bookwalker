import { ProcessedBookInfo, SeriesInfo, SeriesInfoApiResponse } from "@/consts";
import { fetchBookApi, getMultipleBookInfo } from "@/utils/bookwalker/bookApi";
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
  for await (const bookInfo of getMultipleBookInfo(series.bookUUIDs)) {
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

  // Refetch series info if it was cached
  const { series: newSeries } = await createSeries(seriesId, false);
  updateSeriesInfo(newSeries, books, setSeries);
  setSeries(series);

  // Refetch books released after a month ago
  const monthMs = 2592000000;
  const booksToFetch = books.filter(
    (book) => book.date.valueOf() > new Date().valueOf() - monthMs,
  );

  const newBooks: ProcessedBookInfo[] = [
    ...books.filter((book) => !booksToFetch.includes(book)),
  ];
  for await (const bookInfo of getMultipleBookInfo(
    booksToFetch.map((book) => book.uuid),
  )) {
    console.log(`Refetching ${bookInfo.title}`);
    newBooks.push(bookInfo);
  }
  setBooks(newBooks);
  updateSeriesInfo(newSeries, newBooks, setSeries);
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
