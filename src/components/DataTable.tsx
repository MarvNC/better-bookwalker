import "handsontable/dist/handsontable.full.min.css";

import { HotColumn, HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";

import { ProcessedBookInfo } from "@/types";
import { createNewBookInfo } from "@/utils/bookwalker/createNewBookInfo";
import { formatDate } from "@/utils/processInfo";

registerAllModules();

export interface DataTableProps {
  setBooksInfo: (booksInfo: ProcessedBookInfo[]) => void;
  booksInfo: ProcessedBookInfo[];
}

type DataForHot = Array<{
  uuid: string;
  title: string;
  seriesIndex: number;
  date: string;
}>;

export default function DataTable({ booksInfo, setBooksInfo }: DataTableProps) {
  const dataForHot: DataForHot = booksInfo.map((bookInfo) => ({
    uuid: bookInfo.uuid,
    title: bookInfo.title,
    seriesIndex: bookInfo.seriesIndex,
    date: formatDate(bookInfo.date),
  }));

  const mapHotDataToBookInfo = (hotDataArray: DataForHot) => {
    const newBooksInfo: ProcessedBookInfo[] = [];
    for (const hotData of hotDataArray) {
      const bookInfo = booksInfo.find(
        (bookInfo) => bookInfo.uuid === hotData.uuid,
      );
      if (bookInfo) {
        bookInfo.title = hotData.title;
        bookInfo.seriesIndex = hotData.seriesIndex;
        bookInfo.date = new Date(hotData.date);
        newBooksInfo.push(bookInfo);
      } else {
        const newBookInfo = createNewBookInfo({
          newVolume: hotData.seriesIndex,
          newDate: new Date(hotData.date),
          newTitle: hotData.title,
        });
        newBooksInfo.push(newBookInfo);
      }
    }
    return newBooksInfo;
  };
  const onEditCallback = () => {
    const newBooksInfo = mapHotDataToBookInfo(dataForHot);
    setBooksInfo(newBooksInfo);
  };
  return (
    <div>
      <HotTable
        afterChange={(event, data) => {
          if (data !== "edit") {
            console.log(data);
            return;
          }
          onEditCallback();
        }}
        autoWrapCol={true}
        autoWrapRow={true}
        colHeaders={true}
        contextMenu={true}
        data={dataForHot}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
        rowHeaders={true}
      >
        <HotColumn data="seriesIndex" type="numeric" />
        <HotColumn data="title" type="text" />
        <HotColumn data="date" dateFormat="YYYY-MM-DD" type="date" />
      </HotTable>
    </div>
  );
}
