import { Author, ProcessedBookInfo, SeriesInfo } from "@/types";

export type SeriesPreview = { books: ProcessedBookInfo[]; info: SeriesInfo };

export function scrapeSeriesPreview(
  document: Document,
  url: string,
): null | SeriesPreview {
  const location = new URL(url);
  const us = location.hostname === "bookwalker.com";
  const root = us ? document.querySelector("main") : document;
  if (!root) return null;
  const title = root.querySelector("h1")?.textContent?.trim();
  if (!title) return null;
  const books: ProcessedBookInfo[] = [];
  const links = us
    ? root.querySelectorAll<HTMLAnchorElement>(
        '[class*="__volumeCards"] a[href^="/volume/"]',
      )
    : root.querySelectorAll<HTMLAnchorElement>("a.m-thumb__image[data-uuid]");
  const seen = new Set<string>();
  for (const link of links) {
    const href = new URL(link.getAttribute("href")!, url);
    const uuid = us ? href.pathname.split("/")[2] : link.dataset.uuid!;
    if (seen.has(uuid)) continue;
    seen.add(uuid);
    const card = link.closest("[data-book-card-frame]") ?? link;
    const image = card.querySelector<HTMLImageElement>("img");
    const numeric = us
      ? card
          .querySelector('[class*="__numberBoxDisplay"]')
          ?.textContent?.replace(/^VOL\s*/i, "")
          .trim()
      : undefined;
    // US supplies a separate volume field. Never extract the first number from a title.
    const seriesIndex =
      numeric && /^\d+(\.\d+)?$/.test(numeric) ? Number(numeric) : Number.NaN;
    books.push({
      authors: [],
      bookUrl: href.href,
      coverImageUrl: "",
      date: new Date(NaN),
      details: "",
      detailsShort: "",
      label: "",
      pageCount: 0,
      pending: true,
      publisher: "",
      seriesId: location.pathname.split("/")[2],
      seriesIndex,
      thumbnailImageUrl:
        image?.getAttribute("data-original") ||
        image?.getAttribute("src") ||
        "",
      title: us
        ? (card.querySelector('[class*="__title"] a')?.textContent?.trim() ??
          title)
        : image?.alt || title,
      titleKana: "",
      uuid,
    });
  }
  const authors: Author[] = [];
  let publisher = "";
  if (us) {
    for (const label of root.querySelectorAll(
      'dt, [class*="attribute-groups"][class*="__label"]',
    )) {
      const role = label.textContent?.trim();
      if (role === "PUBLISHER")
        publisher = label.nextElementSibling?.textContent?.trim() ?? "";
      if (!/^(AUTHOR|ARTIST)$/i.test(role ?? "")) continue;
      for (const link of label.nextElementSibling?.querySelectorAll("a") ?? [])
        authors.push({
          authorName: link.textContent?.trim() ?? "",
          authorNameKana: "",
          authorTypeName: role!,
        });
    }
  }
  return {
    books,
    info: {
      authors,
      bookUUIDs: books.map((book) => book.uuid),
      dates: { end: undefined, start: undefined },
      label: "",
      publisher,
      seriesId: location.pathname.split("/")[2],
      seriesName: title,
      seriesNameKana: "",
      synopsis:
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") ?? "",
      updateDate: "",
    },
  };
}
