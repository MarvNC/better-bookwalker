import { BookApiResponse, BookInfo } from "../../consts";
import { cachedFetch } from "../fetch";

const bookInfoUrl = (UUID: string) =>
  `https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&${UUID}=0`;

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
    releaseDate: null,
  };
}

export async function fetchBookApi(UUID: string): Promise<BookApiResponse> {
  const response = (await cachedFetch(bookInfoUrl(UUID))) as BookApiResponse;
  if (!response.productId) throw new Error("Invalid response");
  if (!response.productName) throw new Error("Invalid response");
  if (!response.uuid) throw new Error("Invalid response");
  return response;
}
