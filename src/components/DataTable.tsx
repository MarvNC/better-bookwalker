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
  uuid: string | null;
  title: string | null;
  seriesIndex: number | null;
  date: string | null;
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
          newVolume: hotData.seriesIndex,
          newDate: date,
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
