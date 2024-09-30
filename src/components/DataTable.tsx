import "handsontable/dist/handsontable.full.min.css";

import { HotColumn, HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";

import { ProcessedBookInfo } from "@/types";
import { createNewBookInfo } from "@/utils/bookwalker/createNewBookInfo";
import { formatDate } from "@/utils/processInfo";

registerAllModules();

export interface DataTableProps {
  booksInfo: ProcessedBookInfo[];
  setBooksInfo: (booksInfo: ProcessedBookInfo[]) => void;
}

type DataForHot = Array<{
  date: null | string;
  seriesIndex: null | number;
  title: null | string;
  uuid: null | string;
}>;

export default function DataTable({ booksInfo, setBooksInfo }: DataTableProps) {
  const dataForHot: DataForHot = booksInfo.map((bookInfo) => ({
    date: formatDate(bookInfo.date),
    seriesIndex: bookInfo.seriesIndex,
    title: bookInfo.title,
    uuid: bookInfo.uuid,
  }));

  const mapHotDataToBookInfo = (hotDataArray: DataForHot) => {
    const newBooksInfo: ProcessedBookInfo[] = [];
    for (const hotData of hotDataArray) {
      const bookInfo = booksInfo.find(
        (bookInfo) => bookInfo.uuid === hotData.uuid,
      );
      hotData.uuid = hotData.uuid ?? "";
      hotData.title = hotData.title ?? "";
      hotData.seriesIndex = hotData.seriesIndex ?? 0;
      const date = hotData.date ? new Date(hotData.date) : new Date();
      if (bookInfo) {
        bookInfo.title = hotData.title;
        bookInfo.seriesIndex = hotData.seriesIndex;
        bookInfo.date = date;
        newBooksInfo.push(bookInfo);
      } else {
        const newBookInfo = createNewBookInfo({
          newDate: date,
          newTitle: hotData.title,
          newVolume: hotData.seriesIndex,
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
        afterChange={(changes, source) => {
          if (source !== "edit") {
            return;
          }
          console.log(`Changing due to event: ${source}`);
          onEditCallback();
        }}
        afterCreateRow={onEditCallback}
        afterCut={onEditCallback}
        afterPaste={onEditCallback}
        afterRedo={onEditCallback}
        afterRemoveRow={onEditCallback}
        afterUndo={onEditCallback}
        autoWrapCol={true}
        autoWrapRow={true}
        colHeaders={["Volume", "Title", "Date"]}
        contextMenu={["row_above", "row_below", "remove_row"]}
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
