import { seriesInfoUrl } from "@/consts";
import { ProcessedBookInfo, SeriesInfo, SeriesInfoApiResponse } from "@/types";
import { fetchBookApi, getSingleBookInfo } from "@/utils/bookwalker/bookApi";
import { fetch } from "@/utils/fetch";
import {
  getAuthors,
  getDates,
  getLabel,
  getPublisher,
} from "@/utils/getMetaInfo";
import { getSeriesIdFromUrl } from "@/utils/getSeriesIdFromUrl";

import { scrapeSeriesPreview } from "../scrape/seriesPreview";
import { createNewBookInfo } from "./createNewBookInfo";
import { fetchUsSeries } from "./usSeries";

export class Series {
  private _seriesInfo: null | SeriesInfo = null;
  private _booksInfo: ProcessedBookInfo[] = [];
  private seriesId: number;
  private url: string;
  private seriesCallbacks: ((series: SeriesInfo) => void)[] = [];
  private booksCallbacks: ((books: ProcessedBookInfo[]) => void)[] = [];

  constructor(url: string) {
    this.url = url;
    this.seriesId =
      new URL(url).hostname === "bookwalker.com" ? 0 : getSeriesIdFromUrl(url);
  }

  get seriesInfo(): null | SeriesInfo {
    return this._seriesInfo;
  }

  set seriesInfo(newSeriesInfo: null | SeriesInfo) {
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

  async fetchSeries(forceRefresh = false): Promise<void> {
    const preview =
      this.url === window.location.href
        ? scrapeSeriesPreview(document, this.url)
        : null;
    if (!this._seriesInfo && preview) {
      this.seriesInfo = preview.info;
      this.booksInfo = preview.books;
    }
    if (new URL(this.url).hostname === "bookwalker.com") {
      const { books, info } = await fetchUsSeries(this.url, (books, info) => {
        this.booksInfo = books;
        this.seriesInfo = info;
      });
      this.booksInfo = books;
      this.seriesInfo = info;
      return;
    }
    const { series, wasCached } = await this.createSeries(!forceRefresh);
    this.seriesInfo = series;
    const expected = series.bookUUIDs;
    this.booksInfo = this.booksInfo.filter((book) =>
      expected.includes(book.uuid),
    );
    let failures = 0;
    for (let start = 0; start < expected.length; start += 4) {
      await Promise.all(
        expected.slice(start, start + 4).map(async (bookUUID) => {
          try {
            const bookInfo = await getSingleBookInfo(bookUUID, !forceRefresh);
            const byId = new Map(
              this.booksInfo.map((book) => [book.uuid, book]),
            );
            byId.set(bookUUID, bookInfo);
            this.booksInfo = expected.flatMap((id) =>
              byId.has(id) ? [byId.get(id)!] : [],
            );
            this.updateSeriesInfo(series);
          } catch {
            failures++;
          }
        }),
      );
    }
    if (failures)
      throw new Error(
        `${failures} listings could not be loaded. Retry to fetch missing details.`,
      );

    if (!wasCached) {
      return;
    }

    // Reconcile the fresh list even when none of the cached books are recent.
    const { series: fresh } = await this.createSeries(false);
    const byId = new Map(this.booksInfo.map((book) => [book.uuid, book]));
    const pending = fresh.bookUUIDs.filter(
      (id) =>
        !byId.has(id) ||
        byId.get(id)!.pending ||
        byId.get(id)!.date.valueOf() > Date.now() - 2592000000,
    );
    this.seriesInfo = fresh;
    let refreshFailures = 0;
    for (let start = 0; start < pending.length; start += 4) {
      await Promise.all(
        pending.slice(start, start + 4).map(async (id) => {
          try {
            byId.set(id, await getSingleBookInfo(id, false));
            this.booksInfo = fresh.bookUUIDs.flatMap((uuid) =>
              byId.has(uuid) ? [byId.get(uuid)!] : [],
            );
            this.updateSeriesInfo(fresh);
          } catch {
            refreshFailures++;
          }
        }),
      );
    }
    this.booksInfo = fresh.bookUUIDs.flatMap((uuid) =>
      byId.has(uuid) ? [byId.get(uuid)!] : [],
    );
    this.updateSeriesInfo(fresh);
    if (refreshFailures)
      throw new Error(
        `${refreshFailures} listings could not be refreshed. Retry to continue.`,
      );
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
    const newBookInfo = createNewBookInfo({ newDate, newTitle, newVolume });
    this.booksInfo = [...this.booksInfo, newBookInfo];
  }

  private async createSeries(getCache: boolean = true) {
    const { response: seriesApiResponse, wasCached } =
      await this.fetchSeriesApi(getCache);
    const booksUUIDs = seriesApiResponse.series_info.map((book) => book.uuid);
    const firstBookApiResponse = await fetchBookApi(booksUUIDs[0]);
    const series: SeriesInfo = {
      authors: firstBookApiResponse.authors,
      bookUUIDs: booksUUIDs,
      dates: {
        end: undefined,
        start: undefined,
      },
      label: firstBookApiResponse.labelName,
      publisher: "",
      seriesId: this.seriesId,
      seriesName: firstBookApiResponse.seriesName,
      seriesNameKana: firstBookApiResponse.seriesNameKana,
      synopsis: firstBookApiResponse.productExplanationDetails,
      updateDate: seriesApiResponse.update_date,
    };
    return {
      series,
      wasCached,
    };
  }

  private updateSeriesInfo(series: SeriesInfo) {
    this.seriesInfo = {
      ...series,
      authors: getAuthors(this.booksInfo).length
        ? getAuthors(this.booksInfo)
        : series.authors,
      dates: getDates(this.booksInfo),
      label: getLabel(this.booksInfo) || series.label,
      publisher: getPublisher(this.booksInfo) || series.publisher,
    };
  }

  private async fetchSeriesApi(
    getCache: boolean = true,
  ): Promise<{ response: SeriesInfoApiResponse; wasCached: boolean }> {
    const { unknownResponse, wasCached } = await fetch(
      seriesInfoUrl(this.seriesId),
      getCache,
    );
    const response = unknownResponse as SeriesInfoApiResponse;
    if (!response.series_info) throw new Error("Invalid response");
    if (!response.update_date) throw new Error("Invalid response");
    return { response, wasCached };
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
