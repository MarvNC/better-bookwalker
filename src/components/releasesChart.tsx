import { BookInfo } from "@/consts";
import { getDate } from "@/utils/getMetaInfo";
import { ResponsiveLine, Serie } from "@nivo/line";

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
        isInteractive
        legends={[
          {
            anchor: "top",
            direction: "row",
            itemWidth: 200,
            itemHeight: 5,
            translateY: -30,
          },
        ]}
        margin={{ top: 50, right: 40, bottom: 40, left: 40 }}
        useMesh
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
