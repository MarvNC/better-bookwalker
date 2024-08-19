import { ChartLine } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OtherSeriesInputProps {
  addOtherSeries: (url: string) => void;
}

export default function OtherSeriesInput({
  addOtherSeries,
}: OtherSeriesInputProps) {
  const [otherSeriesURL, setOtherSeriesURL] = useState<string>("");

  return (
    <div className="flex items-center gap-4">
      <Input
        className="h-14 flex-grow px-5 py-3 text-xl placeholder:text-slate-400"
        onChange={(e) => setOtherSeriesURL(e.target.value)}
        placeholder="ex. https://global.bookwalker.jp/series/359330/ or https://bookwalker.jp/series/56331/list/"
        type="url"
        value={otherSeriesURL}
      />
      <Button
        className="h-14 px-5 py-3 text-xl transition hover:shadow-md"
        onClick={() => {
          addOtherSeries(otherSeriesURL);
          setOtherSeriesURL("");
        }}
      >
        <ChartLine className="mr-2 h-6 w-6" />
        Add Other Series
      </Button>
    </div>
  );
}
