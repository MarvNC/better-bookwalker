import { useEffect, useState } from "react";
import { SeriesInfo } from "../consts";
import { fetchSeries } from "../utils/bookwalker/seriesApi";

const seriesIdRegex = /\/(\d+)\/list\//;

export default function Series() {
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    const match = url.pathname.match(seriesIdRegex);
    if (!match) throw new Error("Invalid URL");
    const seriesId = parseInt(match[1]);
    fetchSeries(seriesId).then((seriesInfo) => setSeriesInfo(seriesInfo));
  }, []);
  return (
    <>
      {seriesInfo ? (
        <>
          <h1 className="mb-4 text-4xl font-semibold text-sky-700">
            {seriesInfo.seriesName}
          </h1>
          <p className="mb-4 text-sky-700">{seriesInfo.seriesNameKana}</p>
        </>
      ) : (
        "BookWalker Stats Charts: Loading series info..."
      )}
    </>
  );
}
