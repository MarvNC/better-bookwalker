import { ProcessedBookInfo } from "@/types";
import { Series } from "@/utils/bookwalker/series";
import { formatDate } from "@/utils/processInfo";

export async function compareSeries(
  source: null | Series,
  otherSource: null | Series,
  setFeedbackText: (text: string) => void,
  onProjection: (
    primary: ProcessedBookInfo[],
    secondary: ProcessedBookInfo[],
  ) => void,
  cancelled: () => boolean = () => false,
) {
  if (!source) throw new Error("Main series is null");
  if (!otherSource) throw new Error("Other series is null");

  const series = source.createProjection();
  const otherSeries = otherSource.createProjection();
  if (
    series.booksInfo.length < 2 ||
    otherSeries.booksInfo.length < 2 ||
    !Number.isFinite(series.weightedAverageWait) ||
    !Number.isFinite(otherSeries.weightedAverageWait)
  ) {
    setFeedbackText("Both series need at least two dated releases.");
    return;
  }

  /** Whether the main series' line is on top */
  const mainSeriesOnTop = calcMainSeriesOnTop(series, otherSeries);

  // Check if lines will ever intersect
  if (
    (mainSeriesOnTop &&
      series.weightedAverageWait < otherSeries.weightedAverageWait) ||
    (!mainSeriesOnTop &&
      series.weightedAverageWait > otherSeries.weightedAverageWait)
  ) {
    setFeedbackText("These lines will never intersect.");
    return;
  }

  for (let step = 0; step < 500; step++) {
    if (cancelled()) return;
    // Check if latest volumes are the same
    if (series.latestVolume === otherSeries.latestVolume) {
      const latestDate =
        series.latestReleaseDate > otherSeries.latestReleaseDate
          ? series.latestReleaseDate
          : otherSeries.latestReleaseDate;
      const latestVolume = Math.max(
        series.latestVolume,
        otherSeries.latestVolume,
      );
      setFeedbackText(
        `${otherSeries.seriesInfo?.seriesName}: Catch up predicted at volume ${latestVolume} on ${formatDate(latestDate)}.`,
      );
      return;
    }

    // Predict volume on series with closest predicted date
    const mainPredictedDate = series.predictedNextVolumeDate;
    const otherPredictedDate = otherSeries.predictedNextVolumeDate;
    if (mainPredictedDate.valueOf() < otherPredictedDate.valueOf()) {
      series.predictVolume();
    } else {
      otherSeries.predictVolume();
    }

    onProjection(
      series.booksInfo.filter((book) => book.predicted),
      otherSeries.booksInfo.filter((book) => book.predicted),
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  setFeedbackText(
    "Catch-up could not be estimated from the available history.",
  );
}

function calcMainSeriesOnTop(series: Series, otherSeries: Series) {
  return series.latestVolume === otherSeries.latestVolume
    ? series.latestReleaseDate?.valueOf() <
        otherSeries.latestReleaseDate?.valueOf()
    : series.latestVolume > otherSeries.latestVolume;
}
