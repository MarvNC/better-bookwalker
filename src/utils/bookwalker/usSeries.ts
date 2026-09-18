import { bookInfoUsKey } from "@/consts";
import { ProcessedBookInfo, SeriesInfo } from "@/types";
import { fetchDocument, getCachedObject } from "@/utils/fetch";
import { scrapeSeriesPreview } from "@/utils/scrape/seriesPreview";
import { GM } from "$";

import { fetchGlobalJapaneseTitle } from "./globalSeries";

type BookJsonLd = {
  "@type": string | string[];
  author?: { name: string } | { name: string }[];
  brand?: { name: string };
  datePublished?: string;
  description?: string;
  image?: string;
  name?: string;
};

function bookData(document: Document): BookJsonLd | undefined {
  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    try {
      const value = JSON.parse(script.textContent ?? "") as BookJsonLd;
      if (
        value["@type"] === "Book" ||
        (Array.isArray(value["@type"]) && value["@type"].includes("Book"))
      )
        return value;
    } catch {
      // Other structured data on the page may be incomplete.
    }
  }
}

async function loadDocument(url: string): Promise<Document> {
  if (new URL(url).origin === window.location.origin) {
    const response = await window.fetch(url);
    if (!response.ok)
      throw new Error(`Could not load ${url} (${response.status}).`);
    return new DOMParser().parseFromString(await response.text(), "text/html");
  }
  return (await fetchDocument(url)).document;
}

// The US storefront hydrates its volume list after the heading. Publish the heading
// immediately, then wait for actual cards instead of treating hydration as a parse failure.
async function waitForLiveListings(): Promise<void> {
  const ready = () => {
    const main = document.querySelector("main");
    return (
      !!main?.querySelector("h1")?.textContent?.trim() &&
      !!main.querySelector('[class*="__volumeCards"] a[href^="/volume/"]')
    );
  };
  if (ready()) return;
  await new Promise<void>((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (ready()) {
        observer.disconnect();
        clearTimeout(timeout);
        resolve();
      }
    });
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(
        new Error(
          "Volume list has not loaded. Retry after the storefront finishes loading.",
        ),
      );
    }, 15000);
    observer.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  });
}

export async function fetchUsSeries(
  url: string,
  onProgress?: (books: ProcessedBookInfo[], info: SeriesInfo) => void,
  forceRefresh = false,
): Promise<{
  books: ProcessedBookInfo[];
  info: SeriesInfo;
}> {
  const seriesUrl = new URL(url);
  if (
    seriesUrl.hostname !== "bookwalker.com" ||
    !/^\/series\/[A-Z0-9]{12}(?:\/|$)/i.test(seriesUrl.pathname)
  ) {
    throw new Error("Enter a BookWalker US series URL.");
  }
  const seriesId = seriesUrl.pathname.split("/")[2];

  if (seriesUrl.href === window.location.href) await waitForLiveListings();
  const document =
    seriesUrl.href === window.location.href
      ? window.document
      : await loadDocument(seriesUrl.href);
  const storefront = document.querySelector("main");
  const seriesName = storefront?.querySelector("h1")?.textContent?.trim();
  const cards = storefront?.querySelector('[class*="__volumeCards"]');
  const links = cards?.querySelectorAll<HTMLAnchorElement>(
    'a[href^="/volume/"]',
  );
  const volumeUrls = [
    ...new Set(
      Array.from(
        links ?? [],
        (link) => new URL(link.getAttribute("href")!, seriesUrl).href,
      ),
    ),
  ];
  if (!seriesName || !volumeUrls.length)
    throw new Error(
      "Could not find volumes on this BookWalker US series page.",
    );

  const preview = scrapeSeriesPreview(document, url);
  const books: ProcessedBookInfo[] = preview?.books ?? [];
  const info: SeriesInfo = preview?.info ?? {
    authors: [],
    bookUUIDs: [],
    dates: { end: undefined, start: undefined },
    label: "",
    publisher: "",
    seriesId,
    seriesName,
    seriesNameKana: "",
    synopsis: "",
    updateDate: "",
  };
  onProgress?.([...books], { ...info });
  const japaneseTitlePromise = fetchGlobalJapaneseTitle(
    seriesId,
    !forceRefresh,
  ).catch(() => undefined);
  let failures = 0;
  // Keep requests bounded to avoid flooding the storefront with volume page requests.
  for (let start = 0; start < volumeUrls.length; start += 4) {
    await Promise.allSettled(
      volumeUrls.slice(start, start + 4).map(async (bookUrl, offset) => {
        const uuid = new URL(bookUrl).pathname.split("/")[2];
        let data: BookJsonLd | undefined;
        if (!forceRefresh) {
          const cached = await getCachedObject(bookInfoUsKey(uuid));
          if (
            cached &&
            typeof cached === "object" &&
            typeof (cached as BookJsonLd).datePublished === "string"
          )
            data = cached as BookJsonLd;
        }
        if (!data) {
          const volumeDocument = await loadDocument(bookUrl);
          data = bookData(volumeDocument);
          if (data) await GM.setValue(bookInfoUsKey(uuid), data);
        }
        if (!data?.datePublished)
          throw new Error(`No publication date found for ${bookUrl}`);
        const date = new Date(data.datePublished);
        if (Number.isNaN(date.valueOf()))
          throw new Error(`Invalid publication date for ${bookUrl}`);
        const authors = (
          Array.isArray(data.author)
            ? data.author
            : data.author
              ? [data.author]
              : []
        ).map((author) => ({
          authorName: author.name,
          authorNameKana: "",
          authorTypeName: "Author",
        }));
        const image = data.image ?? "";
        const book: ProcessedBookInfo = {
          authors,
          bookUrl,
          coverImageUrl: image,
          date,
          details: data.description ?? "",
          detailsShort: data.description ?? "",
          label: data.brand?.name ?? "",
          pageCount: 0,
          publisher: data.brand?.name ?? "",
          seriesId,
          seriesIndex:
            preview?.books.find((book) => book.bookUrl === bookUrl)
              ?.seriesIndex ?? Number.NaN,
          thumbnailImageUrl: image,
          title: data.name ?? `Volume ${start + offset + 1}`,
          titleKana: "",
          uuid,
        };
        const index = books.findIndex((value) => value.uuid === book.uuid);
        if (index >= 0) books[index] = book;
        else books.push(book);
        info.authors = info.authors.length ? info.authors : authors;
        info.publisher = book.publisher || info.publisher;
        info.label = book.label || info.label;
        onProgress?.([...books], { ...info });
        return book;
      }),
    ).then((results) => {
      failures += results.filter(
        (result) => result.status === "rejected",
      ).length;
    });
  }

  if (failures)
    throw new Error(
      `${failures} listings could not be loaded. Retry to fetch missing details.`,
    );
  info.japaneseTitle = await japaneseTitlePromise;
  onProgress?.([...books], { ...info });
  const first = books[0];
  const description =
    document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content") ?? "";
  return {
    books,
    info: {
      authors: info.authors,
      bookUUIDs: books.map((book) => book.uuid),
      dates: { end: books[books.length - 1].date, start: first.date },
      japaneseTitle: info.japaneseTitle,
      label: first.label,
      publisher: first.publisher,
      seriesId,
      seriesName,
      seriesNameKana: "",
      synopsis: description,
      updateDate: "",
    },
  };
}
