import "react-toastify/dist/ReactToastify.css";

import { Library } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-toastify";

import BookGrid from "@/components/BookGrid";
import ReleasesChart from "@/components/releasesChart";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ProcessedBookInfo, SeriesInfo } from "@/types";
import { Series } from "@/utils/bookwalker/series";
import { formatDate } from "@/utils/processInfo";

export const seriesIdRegex = /\/series\/(\d+)\//;

export default function SeriesHeader() {
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [booksInfo, setBooksInfo] = useState<ProcessedBookInfo[]>([]);

  const datesCombinedString = `${formatDate(seriesInfo?.dates.start)} - ${formatDate(seriesInfo?.dates.end)}`;

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const series = new Series(
      window.location.href,
      setSeriesInfo,
      setBooksInfo,
    );
    series.fetchSeries();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2 rounded-lg bg-white p-4 text-sky-800 shadow-md">
        {/* Top line */}
        <div className="flex flex-row justify-between">
          {/* Authors */}
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
          {/* Publisher and label */}
          <div className="flex flex-row gap-5 text-xl text-sky-800">
            {seriesInfo?.publisher && <span>{seriesInfo.publisher}</span>}
            {seriesInfo?.publisher && seriesInfo?.label && <span> - </span>}
            {seriesInfo?.label && <span>{seriesInfo.label}</span>}
          </div>
        </div>

        {/* Title */}
        <HoverCard>
          <HoverCardTrigger className="flex justify-center !no-underline">
            <h1 className="text-center text-5xl font-semibold leading-normal">
              <CopyToClipboard
                onCopy={() => toast.success("Title copied to clipboard!")}
                text={seriesInfo?.seriesName ?? ""}
              >
                <span className="cursor-pointer no-underline">
                  {seriesInfo?.seriesName ?? "Loading series info..."}
                </span>
              </CopyToClipboard>
            </h1>
          </HoverCardTrigger>{" "}
          <HoverCardContent className="min-w-max text-center text-3xl">
            {seriesInfo?.seriesNameKana}
          </HoverCardContent>
        </HoverCard>

        {/* Dates / Volume count */}
        {seriesInfo && (
          <div className="flex flex-row items-center gap-2 text-2xl font-light text-sky-800">
            <CopyToClipboard
              onCopy={() => toast.success("Dates copied to clipboard!")}
              text={datesCombinedString}
            >
              <span className="cursor-pointer">{datesCombinedString}</span>
            </CopyToClipboard>
            <span>・</span>
            <span className="flex items-center gap-1" title="Volume count">
              <Library />
              <span>{seriesInfo.bookUUIDs.length}</span>
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      {booksInfo.length > 0 && (
        <ReleasesChart
          booksInfo={booksInfo}
          title={seriesInfo?.seriesName ?? ""}
        />
      )}
      {/* Book Grid */}
      <BookGrid booksInfo={booksInfo} />
    </div>
  );
}
