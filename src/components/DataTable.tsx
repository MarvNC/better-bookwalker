import "handsontable/dist/handsontable.full.min.css";

import { HotColumn, HotTable, HotTableClass } from "@handsontable/react";
import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import { useRef } from "react";

import { ProcessedBookInfo } from "@/types";
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
  // const mapHotDataToBookInfo = (hotDataArray: DataForHot) => {
  //   const newBooksInfo = [...booksInfo];
  //   for (const hotData of hotDataArray) {
  //     const bookInfo = booksInfo.find(
  //       (bookInfo) => bookInfo.uuid === hotData.uuid,
  //     );
  //     if (bookInfo) {
  //       bookInfo.seriesIndex = hotData.seriesIndex;
  //       bookInfo.date = new Date(hotData.date);
  //       newBooksInfo.push(bookInfo);
  //     } else {
  //       newBooksInfo.push({
  //         uuid: hotData.uuid,
  //         title: hotData.title,
  //         seriesIndex: hotData.seriesIndex,
  //         date: new Date(hotData.date),
  //       });
  //     }
  //   }
  // };
  // const onEditCallback = () => {
  //   console.log(dataForHot);
  // };
  return (
    <div>
      <HotTable
        afterChange={(event, data) => {
          if (data !== "edit") {
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
        <HotColumn data="seriesIndex" readOnly={false} type="numeric" />
        <HotColumn data="title" readOnly={true} type="text" />
        <HotColumn
          data="date"
          dateFormat="YYYY-MM-DD"
          readOnly={false}
          type="date"
        />
      </HotTable>
    </div>
  );
}
