import { SeriesInfo, SeriesInfoApiResponse } from "../../consts";
import { GM } from "$";
import { cachedFetch } from "../fetch";
import { fetchBookApi, getBookInfo } from "./bookApi";

const seriesInfoUrl = (seriesId: number) =>
  `https://seriesinfo.bookwalker.jp/series_info_${seriesId}_v2.json`;

export async function getSeriesInfo(seriesId: number): Promise<SeriesInfo> {
  const seriesApiResponse = await fetchSeriesApi(seriesId);
  const firstBookUUID = seriesApiResponse.series_info[0].uuid;
  const firstBookApiResponse = await fetchBookApi(firstBookUUID);
  return {
    seriesId,
    seriesName: firstBookApiResponse.seriesName,
    seriesNameKana: firstBookApiResponse.seriesNameKana,
    books: seriesApiResponse.series_info.map((book) => book.uuid),
    updateDate: seriesApiResponse.update_date,
  };
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
