import { seriesInfoUrl } from "@/consts";
import { ProcessedBookInfo, SeriesInfo, SeriesInfoApiResponse } from "@/types";
import {
  fetchBookApi,
  getMultipleBookInfo,
  getSingleBookInfo,
} from "@/utils/bookwalker/bookApi";
import { fetch } from "@/utils/fetch";
import {
  getAuthors,
  getDates,
  getLabel,
  getPublisher,
} from "@/utils/getMetaInfo";
import { getSeriesIdFromUrl } from "@/utils/getSeriesIdFromUrl";

import { createNewBookInfo } from "./createNewBookInfo";

export class Series {
  private _seriesInfo: SeriesInfo | null = null;
  private _booksInfo: ProcessedBookInfo[] = [];
  private seriesId: number;
  private seriesCallbacks: ((series: SeriesInfo) => void)[] = [];
  private booksCallbacks: ((books: ProcessedBookInfo[]) => void)[] = [];

  constructor(url: string) {
    this.seriesId = getSeriesIdFromUrl(url);
  }

  get seriesInfo(): SeriesInfo | null {
    return this._seriesInfo;
  }

  set seriesInfo(newSeriesInfo: SeriesInfo | null) {
    this._seriesInfo = newSeriesInfo;
    if (newSeriesInfo) {
      this.seriesCallbacks.forEach((callback) =>
        callback({ ...newSeriesInfo }),
      );
    }
  }

  get booksInfo(): ProcessedBookInfo[] {
    return this._booksInfo;
  }

  set booksInfo(newBooksInfo: ProcessedBookInfo[]) {
    this._booksInfo = newBooksInfo;
    this.booksCallbacks.forEach((callback) => callback([...newBooksInfo]));
  }

  get latestVolume(): number {
    return this.booksInfo.reduce(
      (prev, curr) => Math.max(prev, curr.seriesIndex),
      0,
    );
  }

  get latestReleaseDate(): Date {
    return new Date(
      this.booksInfo.reduce(
        (prev, curr) => Math.max(prev, curr.date.valueOf()),
        0,
      ),
    );
  }

  get predictedNextVolumeDate(): Date {
    return predictDate(this.booksInfo);
  }

  get weightedAverageWait(): number {
    return weightedAverageWait(this.booksInfo);
  }

  registerSeriesCallback(callback: (series: SeriesInfo) => void): void {
    this.seriesCallbacks.push(callback);
  }

  registerBooksCallback(callback: (books: ProcessedBookInfo[]) => void): void {
    this.booksCallbacks.push(callback);
  }

  async fetchSeries(): Promise<void> {
    this._seriesInfo = null;
    this._booksInfo = [];
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
    const newDate = predictDate(this._booksInfo);
    const newTitle = `Predicted Volume ${newVolume}`;
    const newBookInfo = createNewBookInfo({ newVolume, newDate, newTitle });
    this.booksInfo = [...this.booksInfo, newBookInfo];
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
      synopsis: firstBookApiResponse.productExplanationDetails,
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

/**
 * Predicts the date of a new volume based on the current volumes.
 */
function predictDate(booksInfo: ProcessedBookInfo[]) {
  return new Date(
    booksInfo[booksInfo.length - 1].date.valueOf() +
      weightedAverageWait(booksInfo),
  );
}

function weightedAverageWait(booksInfo: ProcessedBookInfo[]) {
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

  // Weighted average of time between volumes based on recency, with an exponential weight of 1.2 for recent volumes
  const weights = timeBetweenVolumes.map((_, index) => Math.pow(1.2, index));
  const weightedSum = timeBetweenVolumes
    .map((time, index) => time * weights[index])
    .reduce((prev, curr) => prev + curr, 0);
  const weightSum = weights.reduce((prev, curr) => prev + curr, 0);
  const weightedAverage = weightedSum / weightSum;
  return weightedAverage;
}
