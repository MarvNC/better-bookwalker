import { ProcessedBookInfo } from "@/types";

export const day = 86400000;
export const validDate = (date: Date) => Number.isFinite(date.valueOf());
export const dateLabel = (date: Date) =>
  validDate(date) ? date.toISOString().slice(0, 10) : "—";
export const volumeNumber = (book: ProcessedBookInfo) => book.seriesIndex;
// Keep every source listing. Fractional numbers do not establish edition relationships.
export function datedBooks(books: ProcessedBookInfo[]) {
  return books
    .filter((book) => validDate(book.date))
    .sort(
      (a, b) =>
        a.date.valueOf() - b.date.valueOf() || a.seriesIndex - b.seriesIndex,
    );
}
export function releaseStats(books: ProcessedBookInfo[]) {
  const released = datedBooks(books).filter(
    (book) => book.date.valueOf() <= Date.now(),
  );
  const dates = [...new Set(released.map((book) => book.date.valueOf()))];
  const intervals = dates
    .slice(1)
    .map((date, index) => (date - dates[index]) / day);
  const recent = intervals.slice(-5);
  const pace = recent.length
    ? Math.round(recent.reduce((sum, value) => sum + value, 0) / recent.length)
    : null;
  return {
    intervals,
    next:
      pace && dates.length
        ? new Date(dates[dates.length - 1] + pace * day)
        : null,
    pace,
    released,
  };
}
// Calendar boundaries, not evenly divided timestamps, keep labels and gridlines consistent.
export function calendarAxis(min: number, max: number) {
  const months = Math.max(1, (max - min) / (30.4375 * day));
  const step =
    [1, 2, 3, 6, 12, 24, 60, 120].find((value) => months / value <= 9) ??
    Math.ceil(months / 120) * 12;
  const start = new Date(min);
  const month = start.getUTCFullYear() * 12 + start.getUTCMonth();
  const first = Math.floor(month / step) * step;
  const ticks: number[] = [];
  let cursor = first;
  let date = Date.UTC(Math.floor(cursor / 12), cursor % 12, 1);
  const domainStart = date;
  while (date <= max || ticks.length < 2) {
    ticks.push(date);
    cursor += step;
    date = Date.UTC(Math.floor(cursor / 12), cursor % 12, 1);
  }
  ticks.push(date);
  return { max: date, min: domainStart, ticks, yearOnly: step >= 12 };
}
export function volumeAxis(max: number, padded = false) {
  const rough = Math.max(1, max / 7);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10]
    .map((value) => value * magnitude)
    .find((value) => value >= rough)!;
  const ceiling = Math.max(
    step,
    Math.ceil((max + (padded ? step : 0)) / step) * step,
  );
  return {
    max: ceiling,
    ticks: Array.from(
      { length: Math.round(ceiling / step) + 1 },
      (_, index) => index * step,
    ),
  };
}
