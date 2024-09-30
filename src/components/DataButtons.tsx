import {
  Calculator,
  CalendarMinus,
  CalendarPlus,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Series } from "@/utils/bookwalker/series";

interface DataButtonsProps {
  compareSeries: () => void;
  otherSeriesAdded: boolean;
  resetBothSeries: () => void;
  series: Series;
  setShowTodayMarker: (show: boolean) => void;
  showTodayMarker: boolean;
}

export default function DataButtons({
  compareSeries,
  otherSeriesAdded,
  resetBothSeries,
  series,
  setShowTodayMarker,
  showTodayMarker,
}: DataButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        className="h-14 flex-1 px-5 py-3 text-xl transition hover:shadow-md"
        onClick={() => series.predictVolume()}
      >
        <CalendarPlus className="mr-2 h-6 w-6" />
        Add Release Prediction
      </Button>

      <Button
        className="h-14 flex-1 px-5 py-3 text-xl transition hover:shadow-md"
        onClick={resetBothSeries}
      >
        <RotateCcw className="mr-2 h-6 w-6" />
        Reset Data
      </Button>

      <Button
        className="h-14 flex-1 px-5 py-3 text-xl transition hover:shadow-md"
        onClick={() => setShowTodayMarker(!showTodayMarker)}
      >
        {showTodayMarker ? (
          <>
            <CalendarMinus className="mr-2 h-6 w-6" />
            Hide Today Marker
          </>
        ) : (
          <>
            <CalendarPlus className="mr-2 h-6 w-6" />
            Show Today Marker
          </>
        )}
      </Button>

      {otherSeriesAdded && (
        <Button
          className="h-14 flex-1 px-5 py-3 text-xl transition hover:shadow-md"
          onClick={compareSeries}
        >
          <Calculator className="mr-2 h-6 w-6" />
          Calculate Catch-up Date
        </Button>
      )}
    </div>
  );
}
