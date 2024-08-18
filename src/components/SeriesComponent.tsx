import "react-toastify/dist/ReactToastify.css";

import { CalendarPlus, ChartLine, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import BookGrid from "@/components/BookGrid";
import ReleasesChart from "@/components/ReleasesChart";
import SeriesHeader from "@/components/SeriesHeader";
import { ProcessedBookInfo, SeriesInfo } from "@/types";
import { Series } from "@/utils/bookwalker/series";

import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Input } from "./ui/input";

export default function SeriesComponent() {
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [booksInfo, setBooksInfo] = useState<ProcessedBookInfo[]>([]);
  const [series, setSeries] = useState<Series | null>(null);

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
    setSeries(series);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <SeriesHeader seriesInfo={seriesInfo} />

      {/* Chart */}
      {booksInfo.length > 0 && (
        <ReleasesChart
          booksInfo={booksInfo}
          title={seriesInfo?.seriesName ?? ""}
        />
      )}

      <div className="flex flex-col gap-2 rounded-lg bg-white p-4 text-sky-800 shadow-md">
        <Collapsible>
          <CollapsibleTrigger className="flex w-full cursor-pointer flex-row items-center justify-center gap-2 text-center text-2xl text-sky-800">
            <span className="">Data Options</span>
            <ChevronsUpDown />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 flex items-center justify-between gap-6">
              <Button
                className="h-14 flex-1 px-5 py-3 text-xl"
                onClick={() => console.log("Add Release Prediction clicked")}
              >
                <CalendarPlus className="mr-2 h-6 w-6" />
                Add Release Prediction
              </Button>
              <div className="flex flex-1 items-center gap-4">
                <Input
                  className="h-14 flex-grow px-5 py-3 text-xl placeholder:text-slate-400"
                  placeholder="https://global.bookwalker.jp/series/359330/"
                  type="url"
                />
                <Button
                  className="h-14 px-5 py-3 text-xl"
                  onClick={() => console.log("Compare Series clicked")}
                >
                  <ChartLine className="mr-2 h-6 w-6" />
                  Compare
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Book Grid */}
      <BookGrid booksInfo={booksInfo} />
    </div>
  );
}
