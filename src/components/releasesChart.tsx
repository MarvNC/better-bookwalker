import { ResponsiveLine, Serie } from "@nivo/line";

import { BookInfo } from "@/consts";
import { getDate } from "@/utils/getMetaInfo";

export default function ReleasesChart({
  booksInfo,
  title,
}: {
  booksInfo: BookInfo[];
  title: string;
}) {
  // const data = booksInfo.map((book) => ({
  //   name: book.title,
  //   date: getDate(book),
  // }));
  const data: Serie[] = [
    {
      id: title,
      data: booksInfo.map((book) => ({
        x: new Date(getDate(book)),
        y: book.seriesIndex,
        name: book.title,
      })),
    },
  ];
  return (
    <div className="h-[50rem] max-h-[80vh] rounded-lg bg-white p-4">
      <ResponsiveLine
        animate
        axisBottom={{ format: "%Y-%m" }}
        colors={{ scheme: "pastel1" }}
        curve="monotoneX"
        data={data}
        enableGridX
        enableSlices="x"
        isInteractive
        legends={[
          {
            anchor: "top",
            direction: "row",
            itemWidth: 0,
            itemHeight: 0,
            translateY: -30,
          },
        ]}
        margin={{ top: 50, right: 40, bottom: 40, left: 40 }}
        sliceTooltip={({ slice }) => {
          console.log(slice);
          const point = slice.points[0];
          // @ts-expect-error - we put the name in the data object above
          const name = point.data.name;
          const date = point.data.xFormatted;
          return (
            <div className="flex flex-col gap-2 bg-white p-4 shadow-md">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3.5 w-3.5"
                  style={{ backgroundColor: point.serieColor }}
                ></span>
                <span className="font-semibold text-sky-800">{date}</span>
              </div>
              <span className="">{name}</span>
            </div>
          );
        }}
        // useMesh
        xFormat="time:%Y-%m-%d"
        xScale={{
          format: "%Y-%m-%d",
          precision: "day",
          type: "time",
          useUTC: false,
        }}
      />
    </div>
  );
}