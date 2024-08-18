import "react-toastify/dist/ReactToastify.css";

import { useEffect, useRef, useState } from "react";

import BookGrid from "@/components/BookGrid";
import ReleasesChart from "@/components/ReleasesChart";
import SeriesHeader from "@/components/SeriesHeader";
import { ProcessedBookInfo, SeriesInfo } from "@/types";
import { Series } from "@/utils/bookwalker/series";
import { formatDate } from "@/utils/processInfo";

export const seriesIdRegex = /\/series\/(\d+)\//;

export default function SeriesComponent() {
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
      {SeriesHeader(seriesInfo, datesCombinedString)}

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
