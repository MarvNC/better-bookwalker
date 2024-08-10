import { GM } from "$";
import {
  BookApiResponse,
  BookApiSingleBook,
  BookInfo,
  BookInfoFromApi,
  BookInfoFromScrape,
} from "../../consts";
import { cachedFetch, fetchDocument, getCached } from "../fetch";

const bookInfoApiKey = (UUID: string) => `bookInfoApi_${UUID}`;
const bookInfoScrapeKey = (UUID: string) => `bookInfoScrape_${UUID}`;

const bookInfoUrl = (UUID: string) =>
  `https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&${UUID}=0`;

// https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&078491d3-6782-4650-a524-c22f33c3bc9d=0&1969f44b-0e22-4fc9-a9d0-55324b33ab55=1
const multipleBookInfoUrl = (UUIDs: string[]) => {
  return `https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&${UUIDs.map((UUID, index) => `${UUID}=${index}`).join("&")}`;
};

export async function getBookInfo(UUID: string): Promise<BookInfoFromApi> {
  const bookApiResponse = await fetchBookApi(UUID);
  return {
    uuid: bookApiResponse.uuid,
    title: bookApiResponse.productName,
    titleKana: bookApiResponse.productNameKana,
    seriesId: bookApiResponse.seriesId,
    seriesIndex: bookApiResponse.seriesNo,
    detailsShort: bookApiResponse.productExplanationShort,
    details: bookApiResponse.productExplanationDetails,
    thumbnailImageUrl: bookApiResponse.thumbnailImageUrl,
    coverImageUrl: bookApiResponse.coverImageUrl,
  };
}

export async function* getMultipleBookInfo(
  UUIDs: string[],
): AsyncGenerator<BookInfo> {
  for (const uuid of UUIDs) {
    const bookApiResponse = await fetchBookApi(uuid);
    const bookInfoFromScrape = await fetchBookScrape(uuid);
    yield {
      uuid: bookApiResponse.uuid,
      title: bookApiResponse.productName,
      titleKana: bookApiResponse.productNameKana,
      seriesId: bookApiResponse.seriesId,
      seriesIndex: bookApiResponse.seriesNo,
      detailsShort: bookApiResponse.productExplanationShort,
      details: bookApiResponse.productExplanationDetails,
      thumbnailImageUrl: bookApiResponse.thumbnailImageUrl,
      coverImageUrl: bookApiResponse.coverImageUrl,
      ...bookInfoFromScrape,
    };
  }
}

export async function fetchBookApi(UUID: string): Promise<BookApiSingleBook> {
  const cached = await getCached(bookInfoApiKey(UUID));
  if (cached) return cached;

  const response = (await cachedFetch(bookInfoUrl(UUID))) as BookApiResponse;
  if (!response[0]?.productId) throw new Error("Invalid response");
  if (!response[0]?.productName) throw new Error("Invalid response");
  if (!response[0]?.uuid) throw new Error("Invalid response");
  GM.setValue(`bookInfo_${response[0].uuid}`, response[0]);
  return response[0];
}

export async function fetchBookScrape(
  UUID: string,
): Promise<BookInfoFromScrape> {
  const cached = await getCached(bookInfoScrapeKey(UUID));
  if (cached) return cached;

  const bookInfo = await scrapeBook(UUID);
  GM.setValue(bookInfoScrapeKey(UUID), bookInfo);
  return bookInfo;
}

async function scrapeBook(UUID: string): Promise<BookInfoFromScrape> {
  const document = await fetchDocument(bookInfoUrl(UUID));

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
    pageCount: pageCount,
    startDateDigital: startDateDigitalString,
    startDatePrint: startDatePrintString,
  };
}
