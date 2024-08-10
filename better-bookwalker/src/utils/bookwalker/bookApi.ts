import { GM } from "$";
import { BookApiResponse, BookApiSingleBook, BookInfo } from "../../consts";
import { cachedFetch, getCached } from "../fetch";

const bookInfoKey = (UUID: string) => `bookInfo_${UUID}`;

const bookInfoUrl = (UUID: string) =>
  `https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&${UUID}=0`;

// https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&078491d3-6782-4650-a524-c22f33c3bc9d=0&1969f44b-0e22-4fc9-a9d0-55324b33ab55=1
const multipleBookInfoUrl = (UUIDs: string[]) => {
  return `https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&${UUIDs.map((UUID, index) => `${UUID}=${index}`).join("&")}`;
};

export async function getBookInfo(UUID: string): Promise<BookInfo> {
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

export async function getMultipleBookInfo(
  UUIDs: string[],
): Promise<BookInfo[]> {
  const bookApiResponse = await fetchMultipleBookApi(UUIDs);
  return bookApiResponse.map((bookApiResponse, index) => {
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
  });
}

export async function fetchBookApi(UUID: string): Promise<BookApiSingleBook> {
  const cached = await getCached(bookInfoKey(UUID));
  if (cached) return cached;

  const response = (await cachedFetch(bookInfoUrl(UUID))) as BookApiResponse;
  if (!response[0]?.productId) throw new Error("Invalid response");
  if (!response[0]?.productName) throw new Error("Invalid response");
  if (!response[0]?.uuid) throw new Error("Invalid response");
  GM.setValue(`bookInfo_${response[0].uuid}`, response[0]);
  return response[0];
}

// Main function to fetch multiple books by splitting the UUIDs into chunks
export async function fetchMultipleBookApi(
  UUIDs: string[],
): Promise<BookApiResponse> {
  const chunks = chunkArray(UUIDs, 7);
  const results: BookApiResponse = [];

  for (const chunk of chunks) {
    const chunkResult = await fetchChunk(chunk);
    results.push(...chunkResult);
  }

  return results;
}

// Helper function to chunk an array into smaller arrays of a specified size
function chunkArray(array: string[], size: number): string[][] {
  const result: string[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Function to fetch a chunk of UUIDs
async function fetchChunk(UUIDs: string[]): Promise<BookApiResponse> {
  const response = (await cachedFetch(
    multipleBookInfoUrl(UUIDs),
  )) as BookApiResponse;
  if (!response[0]?.productId) throw new Error("Invalid response");
  if (!response[0]?.productName) throw new Error("Invalid response");
  if (!response[0]?.uuid) throw new Error("Invalid response");
  for (const book of response) {
    GM.setValue(bookInfoKey(book.uuid), book);
  }
  return response;
}
