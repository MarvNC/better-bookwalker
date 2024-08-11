import React, { useEffect, useRef, useState } from "react";
import { Author, BookInfo, pubDates, SeriesInfo } from "../consts";
import { fetchSeries } from "../utils/bookwalker/seriesApi";
import { getMultipleBookInfo } from "../utils/bookwalker/bookApi";
import BookGrid from "./BookGrid";
import {
  getAuthors,
  getDates,
  getLabel,
  getPublisher,
} from "../utils/getMetaInfo";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const seriesIdRegex = /\/(\d+)\/list\//;

export default function Series() {
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [booksInfo, setBooksInfo] = useState<BookInfo[]>([]);
  const [authorsInfo, setAuthorsInfo] = useState<Author[]>([]);
  const [label, setLabel] = useState<string>("");
  const [publisher, setPublisher] = useState<string>("");
  const [dates, setDates] = useState<pubDates>({
    start: "",
    end: "",
  });

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
      setDates(getDates(_booksInfo));
    }
    return _booksInfo;
  }

  useEffect(() => {
    if (hasRun.current) return;
    fetchSeriesInfo().then(fetchBooksInfo);
  }, []);

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 text-sky-800">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-10 text-2xl">
            {authorsInfo.map((author) => (
              <span key={author.authorName}>
                <span className="font-light text-slate-400">
                  {/* TODO: make these clickable */}
                  {author.authorTypeName}
                </span>
                <span>: </span>
                <CopyToClipboard
                  text={author.authorName}
                  onCopy={() => toast.success("Copied to clipboard!")}
                >
                  <span className="cursor-pointer">{author.authorName}</span>
                </CopyToClipboard>
              </span>
            ))}
          </div>
          <div className="flex flex-row gap-5 text-xl text-sky-800">
            <span>{publisher}</span>
            <span> - </span>
            <span>{label}</span>
          </div>
        </div>
        <h1 className="text-5xl leading-normal">
          <CopyToClipboard
            text={seriesInfo?.seriesName ?? ""}
            onCopy={() => toast.success("Copied to clipboard!")}
          >
            <span className="cursor-pointer">
              {seriesInfo?.seriesName ?? "Loading series info..."}
            </span>
          </CopyToClipboard>
        </h1>
        {/* <p>{seriesInfo?.seriesNameKana}</p> */}
      </div>
      <BookGrid booksInfo={booksInfo} />
    </>
  );
}
