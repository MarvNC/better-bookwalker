import { seriesInfoUrl } from "@/consts";
import { ProcessedBookInfo, SeriesInfo, SeriesInfoApiResponse } from "@/types";
import {
  fetchBookApi,
  getMultipleBookInfo,
  getSingleBookInfo,
} from "@/utils/bookwalker/bookApi";
import { fetch } from "@/utils/fetch";

import { getAuthors, getDates, getLabel, getPublisher } from "../getMetaInfo";
import { getSeriesIdFromUrl } from "../getSeriesIdFromUrl";

export class Series {
  private seriesInfo: SeriesInfo | null = null;
  private booksInfo: ProcessedBookInfo[] = [];
  private seriesId: number;

  constructor(
    url: string,
    private setSeriesCallback: (series: SeriesInfo) => void,
    private setBooksCallback: (books: ProcessedBookInfo[]) => void,
  ) {
    this.seriesId = getSeriesIdFromUrl(url);
  }

  async fetchSeries(): Promise<void> {
    const { series, wasCached } = await this.createSeries();
    this.updateSeriesInfo(series);

    for (const bookUUID of this.seriesInfo!.bookUUIDs) {
      const bookInfo = await getSingleBookInfo(bookUUID);
      this.booksInfo.push(bookInfo);
      this.updateBooksInfo();
      this.updateSeriesInfo(this.seriesInfo!);
      console.log(
        `Fetched ${this.booksInfo.length} books for series ${this.seriesInfo!.seriesName}: last fetched ${this.booksInfo[this.booksInfo.length - 1].title}`,
      );
    }

    if (!wasCached) {
      return;
    }

    // If the series was cached, refetch latest volumes
    const { series: newSeries } = await this.createSeries(false);
    this.updateSeriesInfo(newSeries);

    // Refetch books released after a month ago
    const monthMs = 2592000000;
    const booksToFetchUUIDs = this.booksInfo
      .filter((book) => book.date.valueOf() > new Date().valueOf() - monthMs)
      .map((book) => book.uuid);

    for (const bookUUID of booksToFetchUUIDs) {
      const bookInfo = await getSingleBookInfo(bookUUID, false);
      console.log(`Refetching ${bookInfo.title}`);
      const newBookList = await getMultipleBookInfo(this.seriesInfo!.bookUUIDs);
      this.booksInfo = newBookList;
      this.updateBooksInfo();
      this.updateSeriesInfo(this.seriesInfo!);
    }
  }

  private async createSeries(getCache: boolean = true) {
    const { wasCached, response: seriesApiResponse } =
      await this.fetchSeriesApi(getCache);
    const booksUUIDs = seriesApiResponse.series_info.map((book) => book.uuid);
    const firstBookApiResponse = await fetchBookApi(booksUUIDs[0]);
    const series: SeriesInfo = {
      seriesId: this.seriesId,
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

  private updateSeriesInfo(series: SeriesInfo) {
    this.seriesInfo = {
      ...series,
      dates: getDates(this.booksInfo),
      publisher: getPublisher(this.booksInfo),
      authors: getAuthors(this.booksInfo),
      label: getLabel(this.booksInfo),
    };
    this.setSeriesCallback(this.seriesInfo);
  }

  private updateBooksInfo() {
    this.setBooksCallback(this.booksInfo);
  }

  private async fetchSeriesApi(
    getCache: boolean = true,
  ): Promise<{ wasCached: boolean; response: SeriesInfoApiResponse }> {
    const { wasCached, unknownResponse } = await fetch(
      seriesInfoUrl(this.seriesId),
      getCache,
    );
    const response = unknownResponse as SeriesInfoApiResponse;
    if (!response.series_info) throw new Error("Invalid response");
    if (!response.update_date) throw new Error("Invalid response");
    return { wasCached, response };
  }
}
