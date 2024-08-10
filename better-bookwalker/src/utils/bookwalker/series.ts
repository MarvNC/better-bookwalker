import { SeriesInfo } from "../../consts";

// import { GM } from "$";
// GM.xmlHttpRequest

const seriesInfoUrl = (seriesId: string) =>
  `https://seriesinfo.bookwalker.jp/series_info_${seriesId}_v2.json`;

// export function getSeriesInfo(seriesId: number): Promise<SeriesInfo> {
