import { useState } from "react";

import { ProcessedBookInfo } from "@/types";
import { preference, savePreference } from "@/utils/preferences";

export type BookOverride = { date?: string; seriesIndex?: number };
export type Overrides = Record<string, BookOverride>;
export function readOverrides(key: string): Overrides {
  try {
    const data: unknown = JSON.parse(preference(key, "{}"));
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const result: Overrides = {};
    for (const [id, value] of Object.entries(data)) {
      if (!value || typeof value !== "object") continue;
      const edit: BookOverride = {};
      if (
        typeof value.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
        Number.isFinite(new Date(value.date).valueOf()) &&
        new Date(value.date).toISOString().slice(0, 10) === value.date
      )
        edit.date = value.date;
      if (
        typeof value.seriesIndex === "number" &&
        Number.isFinite(value.seriesIndex) &&
        value.seriesIndex >= 0
      )
        edit.seriesIndex = value.seriesIndex;
      if (Object.keys(edit).length) result[id] = edit;
    }
    return result;
  } catch {
    return {};
  }
}
export function useBookOverrides(source: ProcessedBookInfo[]) {
  const key = `edits:${location.pathname}`;
  const [overrides, setOverrides] = useState(() => readOverrides(key));
  const apply = (values: Overrides) => {
    setOverrides(values);
    savePreference(key, JSON.stringify(values));
  };
  const books = source.map((book) => {
    const edit = overrides[book.uuid];
    return edit
      ? {
          ...book,
          date: edit.date ? new Date(edit.date) : book.date,
          seriesIndex: edit.seriesIndex ?? book.seriesIndex,
        }
      : book;
  });
  return { apply, books, overrides };
}
