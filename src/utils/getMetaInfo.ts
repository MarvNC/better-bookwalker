import { Author, BookInfo, pubDates } from "@/consts";

export function getAuthors(booksInfo: BookInfo[]) {
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

export function getPublisher(booksInfo: BookInfo[]): string {
  const publishers = new Set<string>();

  publishers.add(booksInfo[0].publisher);
  for (const bookInfo of booksInfo) {
    publishers.add(bookInfo.publisher);
  }

  return Array.from(publishers).join(", ");
}

export function getLabel(booksInfo: BookInfo[]): string {
  const labels = new Set<string>();

  for (const bookInfo of booksInfo) {
    labels.add(bookInfo.label);
  }

  return Array.from(labels).join(", ");
}

export function getDates(booksInfo: BookInfo[]): pubDates {
  const start = booksInfo.length > 0 ? getDate(booksInfo[0]) : "";
  const end =
    booksInfo.length > 1 ? getDate(booksInfo[booksInfo.length - 1]) : "";
  return {
    start,
    end,
  };
}

export function getDate(bookInfo: BookInfo): string {
  if (!bookInfo) return "";
  const date = bookInfo.startDatePrint ?? bookInfo.startDateDigital ?? "";
  return date;
}
