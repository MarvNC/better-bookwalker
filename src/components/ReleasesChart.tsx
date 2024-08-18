import { ResponsiveLine, Serie, SliceTooltipProps } from "@nivo/line";

import { ProcessedBookInfo } from "@/types";

interface ReleasesChartProps {
  booksInfo: ProcessedBookInfo[];
  otherBooksInfo: ProcessedBookInfo[];
  title: string;
  otherTitle: string;
}

export default function ReleasesChart({
  booksInfo,
  title,
  otherBooksInfo,
  otherTitle,
}: ReleasesChartProps) {
  const allBooks = [...booksInfo, ...otherBooksInfo];
  const maxVolume = Math.max(...allBooks.map((book) => book.seriesIndex));
  const today = new Date();
  const maxDate = new Date(
    allBooks.reduce(
      (prev, curr) => Math.max(prev, curr.date.valueOf()),
      today.valueOf(),
    ),
  );

  const data: Serie[] = [
    {
      id: title,
      data: booksInfo.map((book) => ({
        x: book.date,
        y: book.seriesIndex,
        name: book.title,
      })),
    },
  ];
  if (otherBooksInfo.length > 0) {
    data.push({
      id: otherTitle,
      data: otherBooksInfo.map((book) => ({
        x: book.date,
        y: book.seriesIndex,
        name: book.title,
      })),
    });
  }

  const buildTooltip = ({ slice }: SliceTooltipProps) => {
    return (
      <div className="flex flex-col gap-2 bg-white p-4 shadow-md">
        <span className="font-semibold text-sky-800">
          {slice.points[0].data.xFormatted}
        </span>
        {slice.points.map((point, index) => (
          <div className="flex items-center gap-2" key={index}>
            <span
              className="inline-block h-3.5 w-3.5"
              style={{ backgroundColor: point.serieColor }}
            ></span>
            <span className="font-semibold">#{point.data.yFormatted}</span>
            {/* @ts-expect-error - we put the name in the data object above */}
            <span className="">{point.data.name}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-[50rem] max-h-[80vh] rounded-lg bg-white p-4 shadow-md">
      <ResponsiveLine
        animate
        axisBottom={{ format: "%Y-%m" }}
        colors={{ scheme: "pastel1" }}
        curve="monotoneY"
        data={data}
        enableGridX
        enableSlices="x"
        enableTouchCrosshair
        isInteractive
        legends={[
          {
            anchor: "top",
            direction: "row",
            itemHeight: 20,
            itemWidth: title.length * 10,
            toggleSerie: true,
            translateY: -35,
          },
        ]}
        margin={{ top: 50, right: 40, bottom: 40, left: 40 }}
        markers={[
          // Today
          {
            axis: "x",
            legend: "today",
            lineStyle: {
              stroke: "hsl(var(--accent))",
              strokeWidth: 1,
              strokeDasharray: "5,15",
            },
            value: today,
          },
        ]}
        sliceTooltip={buildTooltip}
        xFormat="time:%Y-%m-%d"
        xScale={{
          format: "%Y-%m-%d",
          precision: "day",
          type: "time",
          useUTC: false,
          nice: true,
          max: maxDate,
        }}
        yScale={{
          type: "linear",
          max: maxVolume + 1,
        }}
      />
    </div>
  );
}
