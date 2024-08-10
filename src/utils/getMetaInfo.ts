import { BookInfo, Author } from "../consts";

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
