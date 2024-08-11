import "react-toastify/dist/ReactToastify.css";

import { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-toastify";

import BookGrid from "@/components/BookGrid";
import ReleasesChart from "@/components/releasesChart";
import { ProcessedBookInfo, SeriesInfo } from "@/consts";
import { fetchSeries } from "@/utils/bookwalker/seriesApi";
import { formatDate } from "@/utils/processInfo";

const seriesIdRegex = /\/series\/(\d+)\//;

export default function Series() {
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [booksInfo, setBooksInfo] = useState<ProcessedBookInfo[]>([]);

  const datesCombinedString = `${formatDate(seriesInfo?.dates.start)} - ${formatDate(seriesInfo?.dates.end)}`;

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    console.log(`Fetching series info for ${window.location.href}`);
    const url = new URL(window.location.href);
    const match = url.pathname.match(seriesIdRegex);
    if (!match) throw new Error("Invalid URL");
    const seriesId = parseInt(match[1]);
    fetchSeries(
      seriesId,
      (_seriesInfo) => {
        setSeriesInfo({ ..._seriesInfo });
      },
      (_booksInfo) => {
        setBooksInfo([..._booksInfo]);
      },
    );
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2 text-sky-800">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-10 text-2xl">
            {seriesInfo?.authors.map((author) => (
              <span key={author.authorName}>
                <span className="font-light text-slate-400">
                  {/* TODO: make these clickable */}
                  {author.authorTypeName}
                </span>
                <span> : </span>
                <CopyToClipboard
                  onCopy={() => toast.success("Author copied to clipboard!")}
                  text={author.authorName}
                >
                  <span className="cursor-pointer">{author.authorName}</span>
                </CopyToClipboard>
              </span>
            ))}
          </div>
          <div className="flex flex-row gap-5 text-xl text-sky-800">
            {seriesInfo?.publisher && <span>{seriesInfo.publisher}</span>}
            {seriesInfo?.publisher && seriesInfo?.label && <span> - </span>}
            {seriesInfo?.label && <span>{seriesInfo.label}</span>}
          </div>
        </div>
        <div>
          <h1 className="inline-block text-5xl font-semibold leading-normal">
            <CopyToClipboard
              onCopy={() => toast.success("Title copied to clipboard!")}
              text={seriesInfo?.seriesName ?? ""}
            >
              <span className="cursor-pointer">
                {seriesInfo?.seriesName ?? "Loading series info..."}
              </span>
            </CopyToClipboard>
          </h1>
          <CopyToClipboard
            onCopy={() => toast.success("Dates copied to clipboard!")}
            text={datesCombinedString}
          >
            <p className="inline-block cursor-pointer text-2xl font-thin text-sky-800">
              {datesCombinedString}
            </p>
          </CopyToClipboard>
        </div>
      </div>
      {/* Chart */}
      {booksInfo.length > 0 && (
        <ReleasesChart
          booksInfo={booksInfo}
          title={seriesInfo?.seriesName ?? ""}
        />
      )}
      {/* <ReleasesChart
        booksInfo={booksInfo}
        title={seriesInfo?.seriesName ?? ""}
      /> */}
      {/* Book Grid */}
      <BookGrid booksInfo={booksInfo} />
    </div>
  );
}
