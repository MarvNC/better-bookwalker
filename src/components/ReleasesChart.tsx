import { CartesianMarkerProps } from "@nivo/core";
import { ResponsiveLine, Serie, SliceTooltipProps } from "@nivo/line";

import { ProcessedBookInfo } from "@/types";

interface ReleasesChartProps {
  booksInfo: ProcessedBookInfo[];
  otherBooksInfo: ProcessedBookInfo[];
  otherTitle: string;
  showTodayMarker?: boolean;
  title: string;
}

export default function ReleasesChart({
  booksInfo,
  otherBooksInfo,
  otherTitle,
  showTodayMarker = true,
  title,
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
      data: booksInfo.map((book) => ({
        name: book.title,
        x: book.date,
        y: book.seriesIndex,
      })),
      id: title,
    },
  ];
  if (otherBooksInfo.length > 0) {
    data.push({
      data: otherBooksInfo.map((book) => ({
        name: book.title,
        x: book.date,
        y: book.seriesIndex,
      })),
      id: otherTitle,
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

  const markers: CartesianMarkerProps[] = [];

  if (showTodayMarker) {
    markers.push({
      axis: "x",
      legend: "today",
      // @ts-expect-error - idk why it's not in the type but browser console throws an error
      legendOffsetX: 10,
      legendOffsetY: 20,
      legendOrientation: "horizontal",
      legendPosition: "bottom-left",
      lineStyle: {
        stroke: "rgb(174, 221, 254)",
        strokeDasharray: "10,15",
        strokeWidth: 2,
      },
      textStyle: {
        alignmentBaseline: "middle",
        fill: "rgb(49, 125, 185)",
        fontSize: 15,
        fontWeight: 300,
      },
      value: today,
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
            itemDirection: "left-to-right",
            itemHeight: 20,
            itemOpacity: 0.75,
            itemsSpacing: 0,
            itemWidth: 1000,
            symbolBorderColor: "rgba(0, 0, 0, .5)",
            symbolShape: "circle",
            toggleSerie: true,
            translateY: otherBooksInfo.length > 0 ? -50 : -30,
          },
        ]}
        margin={{ bottom: 40, left: 40, right: 40, top: 50 }}
        markers={markers}
        sliceTooltip={buildTooltip}
        xFormat="time:%Y-%m-%d"
        xScale={{
          format: "%Y-%m-%d",
          max: maxDate,
          nice: true,
          precision: "day",
          type: "time",
          useUTC: false,
        }}
        yScale={{
          max: maxVolume + 1,
          type: "linear",
        }}
      />
    </div>
  );
}
