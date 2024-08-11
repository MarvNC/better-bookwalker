import { useEffect, useRef, useState } from "react";
import { Author, BookInfo, pubDates, SeriesInfo } from "@/consts";
import { fetchSeries } from "@/utils/bookwalker/seriesApi";
import { getMultipleBookInfo } from "@/utils/bookwalker/bookApi";
import BookGrid from "@/components/BookGrid";
import {
  getAuthors,
  getDates,
  getLabel,
  getPublisher,
} from "@/utils/getMetaInfo";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReleasesChart from "@/components/releasesChart";

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
  const datesCombinedString = `${dates.start} - ${dates.end}`;

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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2 text-sky-800">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-10 text-2xl">
            {authorsInfo.map((author) => (
              <span key={author.authorName}>
                <span className="font-light text-slate-400">
                  {/* TODO: make these clickable */}
                  {author.authorTypeName}
                </span>
                <span> : </span>
                <CopyToClipboard
                  text={author.authorName}
                  onCopy={() => toast.success("Author copied to clipboard!")}
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
        <div>
          <h1 className="inline-block text-5xl font-semibold leading-normal">
            <CopyToClipboard
              text={seriesInfo?.seriesName ?? ""}
              onCopy={() => toast.success("Title copied to clipboard!")}
            >
              <span className="cursor-pointer">
                {seriesInfo?.seriesName ?? "Loading series info..."}
              </span>
            </CopyToClipboard>
          </h1>
          <CopyToClipboard
            text={datesCombinedString}
            onCopy={() => toast.success("Dates copied to clipboard!")}
          >
            <p className="inline-block cursor-pointer text-2xl font-thin text-sky-800">
              {datesCombinedString}
            </p>
          </CopyToClipboard>
        </div>
      </div>
      {/* Chart */}
      <ReleasesChart booksInfo={booksInfo} />
      {/* Book Grid */}
      <BookGrid booksInfo={booksInfo} />
    </div>
  );
}
