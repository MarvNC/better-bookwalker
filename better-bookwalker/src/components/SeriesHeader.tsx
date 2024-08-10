import React, { useEffect, useState } from "react";
import { BookInfo, SeriesInfo } from "../consts";
import { fetchSeries } from "../utils/bookwalker/seriesApi";
import { getMultipleBookInfo } from "../utils/bookwalker/bookApi";
import Book from "./Book";

const seriesIdRegex = /\/(\d+)\/list\//;

export default function Series() {
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [booksInfo, setBooksInfo] = useState<BookInfo[]>([]);
  const bookUUIDMap = new Map<string, BookInfo>();

  async function fetchSeriesInfo() {
    const url = new URL(window.location.href);
    const match = url.pathname.match(seriesIdRegex);
    if (!match) throw new Error("Invalid URL");
    const seriesId = parseInt(match[1]);
    const seriesInfo = await fetchSeries(seriesId);
    setSeriesInfo(seriesInfo);
    return seriesInfo;
  }

  async function* fetchBooksInfoGenerator(bookUUIDs: string[]) {
    for await (const bookInfo of getMultipleBookInfo(bookUUIDs)) {
      if (!bookUUIDMap.has(bookInfo.uuid)) {
        bookUUIDMap.set(bookInfo.uuid, bookInfo);
        yield bookInfo;
      }
    }
  }

  async function fetchBooksInfo(seriesInfo: SeriesInfo) {
    if (!seriesInfo) throw new Error("No series info");
    console.log(`Fetching books info for ${seriesInfo.seriesName}`);
    const bookUUIDs = seriesInfo.books;
    const generator = fetchBooksInfoGenerator(bookUUIDs);
    for await (const bookInfo of generator) {
      console.log(`Fetched book info for ${bookInfo.title}`);
      setBooksInfo((prevBooksInfo) => [...prevBooksInfo, bookInfo]);
    }
    console.log(`Finished fetching books info for ${seriesInfo.seriesName}`);
  }

  useEffect(() => {
    fetchSeriesInfo().then(fetchBooksInfo);
  }, []);

  return (
    <>
      {seriesInfo ? (
        <>
          <h1 className="mb-4 text-4xl font-semibold text-sky-700">
            {seriesInfo.seriesName}
          </h1>
          <p className="mb-4 text-sky-700">{seriesInfo.seriesNameKana}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {booksInfo.length > 0
              ? booksInfo.map((bookInfo) => (
                  <Book key={bookInfo.uuid} bookInfo={bookInfo} />
                ))
              : "Loading books info..."}
          </div>
        </>
      ) : (
        "BookWalker Stats Charts: Loading series info..."
      )}
    </>
  );
}
