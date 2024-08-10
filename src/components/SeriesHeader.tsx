import React, { useEffect, useRef, useState } from "react";
import { Author, BookInfo, SeriesInfo } from "../consts";
import { fetchSeries } from "../utils/bookwalker/seriesApi";
import { getMultipleBookInfo } from "../utils/bookwalker/bookApi";
import BookGrid from "./BookGrid";
import { getAuthors, getLabel, getPublisher } from "../utils/getMetaInfo";
import { CopyToClipboard } from "react-copy-to-clipboard";

const seriesIdRegex = /\/(\d+)\/list\//;

export default function Series() {
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [booksInfo, setBooksInfo] = useState<BookInfo[]>([]);
  const [authorsInfo, setAuthorsInfo] = useState<Author[]>([]);
  const [label, setLabel] = useState<string>("");
  const [publisher, setPublisher] = useState<string>("");

  const hasRun = useRef(false);

  async function fetchSeriesInfo() {
    hasRun.current = true;
    console.log(`Fetching series info for ${window.location.href}`);
    const url = new URL(window.location.href);
    const match = url.pathname.match(seriesIdRegex);
    if (!match) throw new Error("Invalid URL");
    const seriesId = parseInt(match[1]);
    const _seriesInfo = await fetchSeries(seriesId);
    setSeriesInfo(_seriesInfo);
    return _seriesInfo;
  }

  async function fetchBooksInfo(seriesInfo: SeriesInfo) {
    if (!seriesInfo) throw new Error("No series info");
    console.log(`Fetching books info for ${seriesInfo.seriesName}`);
    const bookUUIDs = seriesInfo.books;
    const _booksInfo: BookInfo[] = [];
    for await (const bookInfo of getMultipleBookInfo(bookUUIDs)) {
      console.log(`Fetched book info for ${bookInfo.title}`);
      _booksInfo.push(bookInfo);
      setBooksInfo((prevBooksInfo) => [...prevBooksInfo, bookInfo]);
      setAuthorsInfo(getAuthors(_booksInfo));
      setLabel(getLabel(_booksInfo));
      setPublisher(getPublisher(_booksInfo));
    }
    return _booksInfo;
  }

  useEffect(() => {
    if (hasRun.current) return;
    fetchSeriesInfo().then(fetchBooksInfo);
  }, []);

  return (
    <>
      {seriesInfo ? (
        <>
          <div className="mb-4 flex flex-col text-sky-700">
            <h1 className="cursor-pointer text-4xl font-semibold">
              <CopyToClipboard text={seriesInfo.seriesName ?? ""}>
                <span>{seriesInfo.seriesName}</span>
              </CopyToClipboard>
            </h1>
            <div className="flex items-start justify-between">
              <div>
                <p>{seriesInfo.seriesNameKana}</p>
                <p className="text-lg">{publisher}</p>
                <p className="text-lg">{label}</p>
              </div>
              <div>
                {authorsInfo.map((author) => (
                  <div key={author.authorName} className="flex justify-between">
                    <span>{author.authorName}</span>
                    <span className="ml-4 text-sm text-sky-500">
                      {author.authorTypeName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <BookGrid booksInfo={booksInfo} />
        </>
      ) : (
        "BookWalker Stats Charts: Loading series info..."
      )}
    </>
  );
}
