import "handsontable/dist/handsontable.full.min.css";

import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";

import { ProcessedBookInfo } from "@/types";

registerAllModules();

export interface DataTableProps {
  setBooksInfo: (booksInfo: ProcessedBookInfo[]) => void;
}

export default function DataTable(props: DataTableProps) {
  return (
    <div>
      <HotTable
        autoWrapCol={true}
        autoWrapRow={true}
        colHeaders={true}
        data={[
          ["", "Tesla", "Volvo", "Toyota", "Ford"],
          ["2019", 10, 11, 12, 13],
          ["2020", 20, 11, 14, 13],
          ["2021", 30, 15, 12, 13],
        ]}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
        rowHeaders={true}
      />
    </div>
  );
}
