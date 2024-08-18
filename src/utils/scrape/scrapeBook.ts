import { bookPageUrl, storeType } from "@/consts";
import { BookInfoFromScrape } from "@/types";
import { fetchDocument } from "@/utils/fetch";

import { getStoreType } from "../storeType";

export async function scrapeBook(UUID: string): Promise<BookInfoFromScrape> {
  const { document, finalUrl } = await fetchDocument(bookPageUrl(UUID));

  const pageStoreType = getStoreType(finalUrl);

  switch (pageStoreType) {
    case storeType.bw:
    case storeType.r18:
      return scrapeBwBook(document);
    case storeType.bwg:
      return scrapeBwgBook(document);
    default:
      throw new Error("Unknown page type");
  }
}

/**
 * Scrape Bookwalker Global
 * @param document
 * @returns
 */
function scrapeBwgBook(document: Document): BookInfoFromScrape {
  // Date
  const dateSpan = document.querySelector(
    `span[itemprop="productionDate"]`,
  ) as HTMLSpanElement;
  if (!dateSpan) {
    throw new Error("No date span found");
  }
  // August 15, 2024 (12:00 AM) PT / August 15, 2024 (04:00 PM) JST
  const dateString = dateSpan.innerText;
  const JSTDateString = /\/ ([^(]+) \(.+ JST/.exec(dateString)?.[1];
  if (!JSTDateString) {
    throw new Error("No JST date string found");
  }

  // Publisher
  const publisherSpan = document.querySelector(
    `span[itemprop="brand"]`,
  ) as HTMLSpanElement;
  if (!publisherSpan) {
    throw new Error("No publisher span found");
  }
  const publisher = publisherSpan.innerText;

  // Page count
  const productDetailTable = document.querySelector("table.product-detail");

  if (!productDetailTable) {
    throw new Error("No product detail table found");
  }

  const tableHeads = [...productDetailTable.querySelectorAll("th")];
  const pageCountHeader = tableHeads.find(
    (th) => th.innerText === "Page count",
  );
  if (!pageCountHeader) {
    throw new Error("No page count header found");
  }
  const pageCountTd =
    pageCountHeader.nextElementSibling as HTMLTableCellElement;
  if (!pageCountTd) {
    throw new Error("No page count td found");
  }
  // 394pages (*note)
  const pageCountText = pageCountTd.innerText;
  const pageCountMatch = /(\d+)pages/.exec(pageCountText);
  if (!pageCountMatch) {
    throw new Error("No page count match found");
  }
  const pageCount = parseInt(pageCountMatch[1]);

  return {
    label: publisher,
    publisher,
    pageCount,
    startDateDigital: JSTDateString,
    startDatePrint: undefined,
  };
}

/**
 * Scrape Bookwalker JP
 * @param document
 * @returns
 */
function scrapeBwBook(document: Document): BookInfoFromScrape {
  const informationElem = document.querySelector(".p-information__data");
  const dataLabels = (
    informationElem ? [...informationElem.children] : []
  ) as HTMLElement[];

  const startDatePrintDetailsElem = dataLabels.find(
    (elem) => elem.innerText == "底本発行日",
  );
  const startDateDigitalDetailsElem = dataLabels.find(
    (elem) => elem.innerText == "配信開始日",
  );
  const startDatePrintString = (
    startDatePrintDetailsElem?.nextElementSibling as HTMLElement
  )?.innerText;
  const startDateDigitalString = (
    startDateDigitalDetailsElem?.nextElementSibling as HTMLElement
  )?.innerText;

  if (!startDateDigitalString && !startDatePrintString) {
    throw new Error("No start date found");
  }

  const labelElement = document.querySelector(
    '.p-information__data a[href*="/label/"]',
  );
  const label = labelElement?.textContent ?? "";

  const publisherElement = document.querySelector(
    '.p-information__data a[href*="/company/"]',
  );
  const publisher = publisherElement?.textContent ?? "";

  const pageCountElem = (
    [...(informationElem?.children ?? [])] as HTMLElement[]
  ).find((elem) => elem.innerText === "ページ概数");

  const pageCount = pageCountElem
    ? parseInt((pageCountElem.nextElementSibling as HTMLElement)?.innerText)
    : 0;
  return {
    label,
    publisher,
    pageCount,
    startDateDigital: startDateDigitalString,
    startDatePrint: startDatePrintString,
  };
}
