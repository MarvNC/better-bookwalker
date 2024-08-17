import { bookPageUrl } from "@/consts";
import { BookInfoFromScrape } from "@/types";
import { fetchDocument } from "@/utils/fetch";

export async function scrapeBook(UUID: string): Promise<BookInfoFromScrape> {
  const { document, finalUrl } = await fetchDocument(bookPageUrl(UUID));

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
