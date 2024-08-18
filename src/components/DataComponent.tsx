import { CalendarPlus, ChartLine, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Series } from "@/utils/bookwalker/series";

import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Input } from "./ui/input";

export default function DataComponent({ series }: { series: Series }) {
  const [otherSeriesURL, setOtherSeriesURL] = useState<string>("");
  return (
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
              onClick={() => series.predictVolume()}
            >
              <CalendarPlus className="mr-2 h-6 w-6" />
              Add Release Prediction
            </Button>
            <div className="flex flex-1 items-center gap-4">
              <Input
                className="h-14 flex-grow px-5 py-3 text-xl placeholder:text-slate-400"
                onChange={(e) => setOtherSeriesURL(e.target.value)}
                placeholder="https://global.bookwalker.jp/series/359330/"
                type="url"
                value={otherSeriesURL}
              />
              <Button
                className="h-14 px-5 py-3 text-xl"
                // TODO: add compare function
                // onClick={() => series.compare(otherSeriesURL)}
              >
                <ChartLine className="mr-2 h-6 w-6" />
                Compare
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
