import "react-toastify/dist/ReactToastify.css";

import { ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import DataButtons from "@/components/DataButtons";
import OtherSeriesInput from "@/components/OtherSeriesInput";
import ReleasesChart from "@/components/ReleasesChart";
import SeriesHeader from "@/components/SeriesHeader";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ProcessedBookInfo, SeriesInfo } from "@/types";
import { compareSeries } from "@/utils/bookwalker/compareSeries";
import { Series } from "@/utils/bookwalker/series";

import BookCard from "./BookCard";
import DataTable from "./DataTable";

export default function SeriesComponent() {
  const [seriesInfo, setSeriesInfo] = useState<null | SeriesInfo>(null);
  const [booksInfo, setBooksInfo] = useState<ProcessedBookInfo[]>([]);
  const [series, setSeries] = useState<null | Series>(null);
  const [otherSeriesInfo, setOtherSeriesInfo] = useState<null | SeriesInfo>(
    null,
  );
  const [otherBooksInfo, setOtherBooksInfo] = useState<ProcessedBookInfo[]>([]);
  const [otherSeries, setOtherSeries] = useState<null | Series>(null);
  const [SeriesDataFeedbackText, setSeriesDataFeedbackText] =
    useState<string>("");
  const [showTodayMarker, setShowTodayMarker] = useState(true);

  /**
   * Whether the data is loading, so the HOT table shouldn't do callbacks
   */
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);

  const hasRun = useRef(false);

  const setOtherSeriesURL = async (url: string) => {
    const newSeries = new Series(url);

    newSeries.registerSeriesCallback(setOtherSeriesInfo);
    newSeries.registerBooksCallback(setOtherBooksInfo);
    await newSeries.fetchSeries();
    setOtherSeries(newSeries);
  };

  const resetBothSeries = async () => {
    setLoading(true);
    await Promise.all([series?.fetchSeries(), otherSeries?.fetchSeries()]);
    setLoading(false);
  };

  const runCompareSeries = async () => {
    compareSeries(series, otherSeries, setSeriesDataFeedbackText);
  };

  const initSeries = async () => {
    const newSeries = new Series(window.location.href);
    newSeries.registerSeriesCallback(setSeriesInfo);
    newSeries.registerBooksCallback(setBooksInfo);

    await newSeries.fetchSeries();
    setSeries(newSeries);
    setLoading(false);
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    initSeries();
  }, []);

  return (
    <div className="flex flex-col gap-4 pt-32">
      <SeriesHeader seriesInfo={seriesInfo} />
      {booksInfo.length > 0 && (
        <ReleasesChart
          booksInfo={booksInfo}
          otherBooksInfo={otherBooksInfo}
          otherTitle={otherSeriesInfo?.seriesName ?? ""}
          showTodayMarker={showTodayMarker}
          title={seriesInfo?.seriesName ?? ""}
        />
      )}
      {series && (
        <div className="flex flex-col gap-2 rounded-lg bg-white p-4 text-sky-800 shadow-md">
          <Collapsible onOpenChange={setIsOpen} open={isOpen}>
            <CollapsibleTrigger className="flex w-full cursor-pointer flex-row items-center justify-center gap-2 text-center text-2xl text-sky-800">
              <span>Data Options</span>
              <ChevronsUpDown />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4 flex flex-col gap-4">
                <Separator className="w-full" />
                {SeriesDataFeedbackText && (
                  <div className="flex justify-center">
                    <span className="text-2xl text-sky-800">
                      {SeriesDataFeedbackText}
                    </span>
                  </div>
                )}
                <DataButtons
                  compareSeries={runCompareSeries}
                  otherSeriesAdded={Boolean(otherSeriesInfo)}
                  resetBothSeries={resetBothSeries}
                  series={series}
                  setShowTodayMarker={setShowTodayMarker}
                  showTodayMarker={showTodayMarker}
                />
                <OtherSeriesInput addOtherSeries={setOtherSeriesURL} />
                <Separator className="w-full" />
                {!loading && (
                  <DataTable
                    booksInfo={booksInfo}
                    setBooksInfo={(_newBooksInfo) => {
                      series.booksInfo = _newBooksInfo;
                    }}
                  />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
      <div
        className="grid grid-cols-1 gap-4"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))` }}
      >
        {booksInfo.length > 0
          ? booksInfo.map((bookInfo) => (
              <BookCard bookInfo={bookInfo} key={bookInfo.uuid} />
            ))
          : "Loading books info..."}
      </div>{" "}
    </div>
  );
}
