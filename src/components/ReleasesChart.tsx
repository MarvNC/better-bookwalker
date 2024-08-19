import { CartesianMarkerProps, DatumValue } from "@nivo/core";
import { ResponsiveLine, Serie, SliceTooltipProps } from "@nivo/line";

import { ProcessedBookInfo } from "@/types";

interface ReleasesChartProps {
  booksInfo: ProcessedBookInfo[];
  otherBooksInfo: ProcessedBookInfo[];
  title: string;
  otherTitle: string;
  showTodayMarker?: boolean;
}

export default function ReleasesChart({
  booksInfo,
  title,
  otherBooksInfo,
  otherTitle,
  showTodayMarker = true,
}: ReleasesChartProps) {
  const allBooks = [...booksInfo, ...otherBooksInfo];
  const maxVolume = Math.max(...allBooks.map((book) => book.seriesIndex));
  const today = new Date();
  const maxDate = new Date(
    allBooks.reduce(
      (prev, curr) => Math.max(prev, curr.date.valueOf()),
      showTodayMarker ? today.valueOf() : -Infinity,
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

  const markers: CartesianMarkerProps<DatumValue>[] = [];

  if (showTodayMarker) {
    markers.push({
      axis: "x",
      legend: "today",
      lineStyle: {
        stroke: "rgb(174, 221, 254)",
        strokeWidth: 2,
        strokeDasharray: "10,15",
      },
      value: today,
      legendPosition: "bottom-left",
      textStyle: {
        fontSize: 15,
        fontWeight: 300,
        alignmentBaseline: "middle",
        fill: "rgb(49, 125, 185)",
      },
    });
  }

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
            direction: "column",
            translateY: otherBooksInfo.length > 0 ? -50 : -30,
            itemsSpacing: 0,
            itemDirection: "left-to-right",
            itemWidth: 1000,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolShape: "circle",
            symbolBorderColor: "rgba(0, 0, 0, .5)",
            toggleSerie: true,
          },
        ]}
        margin={{ top: 50, right: 40, bottom: 40, left: 40 }}
        markers={markers}
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
