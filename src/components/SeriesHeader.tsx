import React, { useEffect, useRef, useState } from "react";
import { BookInfo, SeriesInfo } from "../consts";
import { fetchSeries } from "../utils/bookwalker/seriesApi";
import { getMultipleBookInfo } from "../utils/bookwalker/bookApi";
import BookGrid from "./BookGrid";

const seriesIdRegex = /\/(\d+)\/list\//;

export default function Series() {
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [booksInfo, setBooksInfo] = useState<BookInfo[]>([]);
  const hasRun = useRef(false);

  async function fetchSeriesInfo() {
    hasRun.current = true;
    console.log(`Fetching series info for ${window.location.href}`);
    const url = new URL(window.location.href);
    const match = url.pathname.match(seriesIdRegex);
    if (!match) throw new Error("Invalid URL");
    const seriesId = parseInt(match[1]);
    const seriesInfo = await fetchSeries(seriesId);
    setSeriesInfo(seriesInfo);
    return seriesInfo;
  }

  async function fetchBooksInfo(seriesInfo: SeriesInfo) {
    if (!seriesInfo) throw new Error("No series info");
    console.log(`Fetching books info for ${seriesInfo.seriesName}`);
    const bookUUIDs = seriesInfo.books;
    for await (const bookInfo of getMultipleBookInfo(bookUUIDs)) {
      console.log(`Fetched book info for ${bookInfo.title}`);
      setBooksInfo((prevBooksInfo) => [...prevBooksInfo, bookInfo]);
    }
    console.log(`Finished fetching books info for ${seriesInfo.seriesName}`);
  }

  useEffect(() => {
    if (hasRun.current) return;
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
          <BookGrid booksInfo={booksInfo} />
        </>
      ) : (
        "BookWalker Stats Charts: Loading series info..."
      )}
    </>
  );
}
