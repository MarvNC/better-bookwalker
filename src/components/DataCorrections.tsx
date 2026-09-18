import { useState } from "react";

import { Overrides } from "@/hooks/useBookOverrides";
import { ProcessedBookInfo } from "@/types";
import { dateLabel, validDate } from "@/utils/seriesView";

type Draft = Record<string, { date?: string; number?: string }>;
export default function DataCorrections({
  books,
  onApply,
  onClose,
  source,
}: {
  books: ProcessedBookInfo[];
  onApply: (edits: Overrides) => void;
  onClose: () => void;
  source: ProcessedBookInfo[];
}) {
  // Draft contains only touched fields. Untouched cells continue to receive fetched data.
  const [draft, setDraft] = useState<Draft>({});
  const [restore, setRestore] = useState(false);
  const rows = restore ? source : books;
  const change = (id: string, field: "date" | "number", value: string) =>
    setDraft((previous) => ({
      ...previous,
      [id]: { ...previous[id], [field]: value },
    }));
  return (
    <form
      className="correction"
      onSubmit={(event) => {
        event.preventDefault();
        const edits: Overrides = {};
        for (const book of rows) {
          const original = source.find((item) => item.uuid === book.uuid);
          if (!original) continue;
          const date =
            draft[book.uuid]?.date ??
            (validDate(book.date) ? dateLabel(book.date) : "");
          const number =
            draft[book.uuid]?.number ??
            (Number.isFinite(book.seriesIndex) ? String(book.seriesIndex) : "");
          const edit: Overrides[string] = {};
          if (date && date !== dateLabel(original.date)) edit.date = date;
          if (number !== "" && Number(number) !== original.seriesIndex)
            edit.seriesIndex = Number(number);
          if (Object.keys(edit).length) edits[book.uuid] = edit;
        }
        onApply(edits);
        onClose();
      }}
    >
      <h2>Correct data</h2>
      <p>
        Override a parsed number or date. Blank fields keep the source value.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>#</th>
              <th>YYYY-MM-DD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((book) => (
              <tr key={book.uuid}>
                <td>{book.title}</td>
                <td>
                  <input
                    aria-label={`Number: ${book.title}`}
                    min="0"
                    onChange={(e) =>
                      change(book.uuid, "number", e.target.value)
                    }
                    step="any"
                    type="number"
                    value={
                      draft[book.uuid]?.number ??
                      (Number.isFinite(book.seriesIndex)
                        ? String(book.seriesIndex)
                        : "")
                    }
                  />
                </td>
                <td>
                  <input
                    aria-label={`Date: ${book.title}`}
                    inputMode="numeric"
                    onChange={(e) => {
                      const value = e.target.value;
                      const valid =
                        !value ||
                        (Number.isFinite(new Date(value).valueOf()) &&
                          new Date(value).toISOString().slice(0, 10) === value);
                      e.target.setCustomValidity(
                        valid ? "" : "Use a valid YYYY-MM-DD date",
                      );
                      change(book.uuid, "date", value);
                    }}
                    pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                    placeholder="YYYY-MM-DD"
                    type="text"
                    value={
                      draft[book.uuid]?.date ??
                      (validDate(book.date) ? dateLabel(book.date) : "")
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="correction-actions">
        <button className="primary">Apply</button>
        <button onClick={onClose} type="button">
          Cancel
        </button>
        <button
          className="quiet"
          onClick={(e) => {
            setDraft({});
            setRestore(true);
            e.currentTarget.form
              ?.querySelectorAll("input")
              .forEach((input) => input.setCustomValidity(""));
          }}
          type="button"
        >
          Restore source values
        </button>
      </div>
    </form>
  );
}
