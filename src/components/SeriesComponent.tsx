import "react-toastify/dist/ReactToastify.css";

import { useEffect, useRef, useState } from "react";

import BookGrid from "@/components/BookGrid";
import DataComponent from "@/components/DataComponent";
import ReleasesChart from "@/components/ReleasesChart";
import SeriesHeader from "@/components/SeriesHeader";
import { ProcessedBookInfo, SeriesInfo } from "@/types";
import { compareSeries } from "@/utils/bookwalker/compareSeries";
import { Series } from "@/utils/bookwalker/series";

export default function SeriesComponent() {
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [booksInfo, setBooksInfo] = useState<ProcessedBookInfo[]>([]);
  const [series, setSeries] = useState<Series | null>(null);
  const [otherSeriesInfo, setOtherSeriesInfo] = useState<SeriesInfo | null>(
    null,
  );
  const [otherBooksInfo, setOtherBooksInfo] = useState<ProcessedBookInfo[]>([]);
  const [otherSeries, setOtherSeries] = useState<Series | null>(null);
  const [SeriesDataFeedbackText, setSeriesDataFeedbackText] =
    useState<string>("");

  const hasRun = useRef(false);

  const setOtherSeriesURL = async (url: string) => {
    const newSeries = new Series(url);

    newSeries.registerSeriesCallback(setOtherSeriesInfo);
    newSeries.registerBooksCallback(setOtherBooksInfo);
    await newSeries.fetchSeries();
    setOtherSeries(newSeries);
  };

  const resetBothSeries = () => {
    series?.fetchSeries();
    otherSeries?.fetchSeries();
  };

  const runCompareSeries = async () => {
    compareSeries(series, otherSeries, setSeriesDataFeedbackText);
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const newSeries = new Series(window.location.href);
    newSeries.registerSeriesCallback(setSeriesInfo);
    newSeries.registerBooksCallback(setBooksInfo);

    newSeries.fetchSeries();
    setSeries(newSeries);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <SeriesHeader seriesInfo={seriesInfo} />

      {/* Chart */}
      {booksInfo.length > 0 && (
        <ReleasesChart
          booksInfo={booksInfo}
          otherBooksInfo={otherBooksInfo}
          otherTitle={otherSeriesInfo?.seriesName ?? ""}
          title={seriesInfo?.seriesName ?? ""}
        />
      )}

      {/* Data Options */}
      {series && (
        <DataComponent
          addOtherSeries={(url) => setOtherSeriesURL(url)}
          compareSeries={() => runCompareSeries()}
          feedbackText={SeriesDataFeedbackText}
          otherSeriesAdded={Boolean(otherSeriesInfo)}
          resetBothSeries={resetBothSeries}
          series={series}
        />
      )}

      {/* Book Grid */}
      <BookGrid booksInfo={booksInfo} />
    </div>
  );
}
