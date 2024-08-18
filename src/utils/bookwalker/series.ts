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
  private _seriesInfo: SeriesInfo | null = null;
  private _booksInfo: ProcessedBookInfo[] = [];
  private seriesId: number;

  constructor(
    url: string,
    private setSeriesCallback: (series: SeriesInfo) => void,
    private setBooksCallback: (books: ProcessedBookInfo[]) => void,
  ) {
    this.seriesId = getSeriesIdFromUrl(url);
  }

  get seriesInfo(): SeriesInfo | null {
    return this._seriesInfo;
  }

  set seriesInfo(newSeriesInfo: SeriesInfo | null) {
    this._seriesInfo = newSeriesInfo;
    if (newSeriesInfo) {
      this.setSeriesCallback({ ...newSeriesInfo });
    }
  }

  get booksInfo(): ProcessedBookInfo[] {
    return this._booksInfo;
  }

  set booksInfo(newBooksInfo: ProcessedBookInfo[]) {
    this._booksInfo = newBooksInfo;
    this.setBooksCallback([...newBooksInfo]);
  }

  async fetchSeries(): Promise<void> {
    const { series, wasCached } = await this.createSeries();
    this.updateSeriesInfo(series);

    for (const bookUUID of this.seriesInfo!.bookUUIDs) {
      const bookInfo = await getSingleBookInfo(bookUUID);
      this.booksInfo = [...this.booksInfo, bookInfo];
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
      this.booksInfo = await getMultipleBookInfo(this.seriesInfo!.bookUUIDs);
      this.updateSeriesInfo(this.seriesInfo!);
    }
  }

  /**
   * Adds a new predicted volume to the series.
   */
  predictVolume() {
    const latestVolume = Math.floor(
      Math.max(...this.booksInfo.map((book) => book.seriesIndex)),
    );
    const newVolume = latestVolume + 1;
    const newDate = this.predictDate(this._booksInfo);
    const newBookInfo: ProcessedBookInfo = {
      uuid: Math.floor(Math.random() * 10000).toString(),
      title: `Predicted Volume ${newVolume}`,
      titleKana: "",
      authors: [],
      seriesIndex: newVolume,
      detailsShort: "",
      details: "",
      thumbnailImageUrl: "",
      coverImageUrl: "",
      seriesId: this.seriesInfo?.seriesId ?? 0,
      date: newDate,
      label: "",
      publisher: "",
      pageCount: 0,
    };
    this.booksInfo = [...this.booksInfo, newBookInfo];
  }

  /**
   * Predicts the date of a new volume based on the current volumes.
   */
  predictDate(booksInfo: ProcessedBookInfo[]) {
    let booksInfoCopy = [...booksInfo];
    const volumeCount = booksInfoCopy.length;
    // Remove books that have the same date as the previous volume to remove tokuten and etc released on the same day
    booksInfoCopy = booksInfoCopy.filter(
      (book, index) =>
        index === 0 ||
        booksInfoCopy[index - 1].date.valueOf() !== book.date.valueOf(),
    );
    console.log(`Removed ${volumeCount - booksInfoCopy.length} books`);
    const timeBetweenVolumes = [];
    for (let i = 1; i < booksInfoCopy.length; i++) {
      timeBetweenVolumes.push(
        booksInfoCopy[i].date.valueOf() - booksInfoCopy[i - 1].date.valueOf(),
      );
    }
    // Weighted average of time between volumes based on recency, with an exponential weight of 0.8 for recent volumes
    const weights = timeBetweenVolumes.map((_, index) => Math.pow(0.8, index));
    const weightedSum = timeBetweenVolumes
      .map((time, index) => time * weights[index])
      .reduce((prev, curr) => prev + curr, 0);
    const weightSum = weights.reduce((prev, curr) => prev + curr, 0);
    const weightedAverage = weightedSum / weightSum;
    console.log(weightedAverage);
    return new Date(
      booksInfoCopy[booksInfoCopy.length - 1].date.valueOf() + weightedAverage,
    );
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
