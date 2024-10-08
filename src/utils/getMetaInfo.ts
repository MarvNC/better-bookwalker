import {
  Author,
  BookInfoFromScrape,
  ProcessedBookInfo,
  pubDates,
} from "@/types";
import { processDate } from "@/utils/processInfo";

export function getAuthors(booksInfo: ProcessedBookInfo[]) {
  const authors: Author[] = [];
  for (const bookInfo of booksInfo) {
    for (const author of bookInfo.authors) {
      if (!authors.find((a) => a.authorName === author.authorName)) {
        authors.push(author);
      }
    }
  }
  return authors;
}

export function getPublisher(booksInfo: ProcessedBookInfo[]): string {
  const publishers = new Set<string>();

  for (const bookInfo of booksInfo) {
    if (bookInfo.publisher) publishers.add(bookInfo.publisher);
  }

  return Array.from(publishers).join(", ") ?? "";
}

export function getLabel(booksInfo: ProcessedBookInfo[]): string {
  const labels = new Set<string>();

  for (const bookInfo of booksInfo) {
    labels.add(bookInfo.label);
  }

  labels.delete("――");

  return Array.from(labels).join(", ");
}

export function getDates(booksInfo: ProcessedBookInfo[]): pubDates {
  const start = booksInfo.length > 0 ? booksInfo[0].date : undefined;
  const end =
    booksInfo.length > 0 ? booksInfo[booksInfo.length - 1].date : undefined;
  return {
    end,
    start,
  };
}

/**
 * Gets the earlier date, published or print date of a book.
 * @param bookInfo
 * @returns
 */
export function getDate(bookInfo: BookInfoFromScrape): Date {
  const startDatePrint = bookInfo.startDatePrint
    ? processDate(bookInfo.startDatePrint)
    : undefined;
  const startDateDigital = bookInfo.startDateDigital
    ? processDate(bookInfo.startDateDigital)
    : undefined;
  if (!startDatePrint && !startDateDigital) {
    throw new Error("Neither date is defined!");
  }
  if (!startDatePrint) return startDateDigital!;
  if (!startDateDigital) return startDatePrint!;
  return startDatePrint < startDateDigital ? startDatePrint : startDateDigital;
}
