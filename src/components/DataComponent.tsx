import {
  Calculator,
  CalendarPlus,
  ChartLine,
  ChevronsUpDown,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Series } from "@/utils/bookwalker/series";

interface DataProps {
  series: Series;
  addOtherSeries: (url: string) => void;
  resetBothSeries: () => void;
  compareSeries: () => void;
  otherSeriesAdded: boolean;
  feedbackText: string;
}

export default function DataComponent({
  series,
  addOtherSeries,
  resetBothSeries,
  compareSeries,
  otherSeriesAdded,
  feedbackText,
}: DataProps) {
  const [otherSeriesURL, setOtherSeriesURL] = useState<string>("");
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-white p-4 text-sky-800 shadow-md">
      <Collapsible>
        <CollapsibleTrigger className="flex w-full cursor-pointer flex-row items-center justify-center gap-2 text-center text-2xl text-sky-800">
          <span>Data Options</span>
          <ChevronsUpDown />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4 flex flex-col gap-4">
            <Separator className="w-full" />
            {/* Feedback Text */}
            {feedbackText && (
              <div className="flex justify-center">
                <span className="text-2xl text-sky-800">{feedbackText}</span>
              </div>
            )}
            {/* Buttons */}
            <div className="flex items-center justify-between gap-4">
              <Button
                className="h-14 flex-1 px-5 py-3 text-xl"
                onClick={() => series.predictVolume()}
              >
                <CalendarPlus className="mr-2 h-6 w-6" />
                Add Release Prediction
              </Button>
              <Button
                className="h-14 flex-1 px-5 py-3 text-xl"
                onClick={() => {
                  resetBothSeries();
                }}
              >
                <RotateCcw className="mr-2 h-6 w-6" />
                Reset Data
              </Button>
              {otherSeriesAdded && (
                <Button
                  className="h-14 flex-1 px-5 py-3 text-xl"
                  onClick={() => {
                    compareSeries();
                  }}
                >
                  <Calculator className="mr-2 h-6 w-6" />
                  Calculate Catch-up Date
                </Button>
              )}
            </div>
            {/* Other Series Input */}
            <div className="flex items-center gap-4">
              <Input
                className="h-14 flex-grow px-5 py-3 text-xl placeholder:text-slate-400"
                onChange={(e) => setOtherSeriesURL(e.target.value)}
                placeholder="ex. https://global.bookwalker.jp/series/359330/ or https://bookwalker.jp/series/56331/list/"
                type="url"
                value={otherSeriesURL}
              />
              <Button
                className="h-14 px-5 py-3 text-xl"
                onClick={() => {
                  addOtherSeries(otherSeriesURL);
                }}
              >
                <ChartLine className="mr-2 h-6 w-6" />
                Add Other Series
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
