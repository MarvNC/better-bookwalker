import { ProcessedBookInfo, SeriesInfo, SeriesInfoApiResponse } from "@/consts";
import { fetchBookApi, getMultipleBookInfo } from "@/utils/bookwalker/bookApi";
import { cachedFetch } from "@/utils/fetch";

import { getAuthors, getDates, getLabel, getPublisher } from "../getMetaInfo";

const seriesInfoUrl = (seriesId: number) =>
  `https://seriesinfo.bookwalker.jp/series_info_${seriesId}_v2.json`;

export async function fetchSeries(
  seriesId: number,
  setSeries: (series: SeriesInfo) => void,
  setBooks: (books: ProcessedBookInfo[]) => void,
): Promise<void> {
  const seriesApiResponse = await fetchSeriesApi(seriesId);
  const booksUUIDs = seriesApiResponse.series_info.map((book) => book.uuid);
  const firstBookApiResponse = await fetchBookApi(booksUUIDs[0]);
  const series: SeriesInfo = {
    seriesId,
    seriesName: firstBookApiResponse.seriesName,
    seriesNameKana: firstBookApiResponse.seriesNameKana,
    books: booksUUIDs,
    updateDate: seriesApiResponse.update_date,
    authors: firstBookApiResponse.authors,
    label: firstBookApiResponse.labelName,
    publisher: "",
    dates: {
      start: undefined,
      end: undefined,
    },
  };
  setSeries(series);
  const books: ProcessedBookInfo[] = [];
  for await (const bookInfo of getMultipleBookInfo(booksUUIDs)) {
    books.push(bookInfo);
    setBooks(books);
    series.dates = getDates(books);
    series.publisher = getPublisher(books);
    series.authors = getAuthors(books);
    series.label = getLabel(books);
    setSeries(series);
  }
}

async function fetchSeriesApi(
  seriesId: number,
): Promise<SeriesInfoApiResponse> {
  const response = (await cachedFetch(
    seriesInfoUrl(seriesId),
  )) as SeriesInfoApiResponse;
  if (!response.series_info) throw new Error("Invalid response");
  if (!response.update_date) throw new Error("Invalid response");
  return response;
}
