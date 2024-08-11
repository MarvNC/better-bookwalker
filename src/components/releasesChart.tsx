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
      })),
    },
  ];
  return (
    <div className="h-[50rem] max-h-[80vh] rounded-lg bg-white p-4">
      <ResponsiveLine
        animate
        curve="monotoneX"
        margin={{ top: 50, right: 35, bottom: 35, left: 35 }}
        legends={[
          {
            anchor: "top",
            direction: "row",
            itemWidth: 200,
            itemHeight: 5,
            translateY: -30,
          },
        ]}
        isInteractive
        useMesh
        colors={{ scheme: "pastel1" }}
        data={data}
        xScale={{ type: "time", format: "%Y-%m" }}
      ></ResponsiveLine>
    </div>
  );
}
