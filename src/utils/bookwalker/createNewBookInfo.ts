import { ProcessedBookInfo } from "@/types";

export function createNewBookInfo({
  newVolume,
  newDate,
  newTitle,
}: {
  newVolume: number;
  newDate: Date;
  newTitle: string;
}): ProcessedBookInfo {
  return {
    uuid: Math.floor(Math.random() * 10000).toString(),
    title: newTitle,
    titleKana: "",
    authors: [],
    seriesIndex: newVolume,
    detailsShort: "",
    details: "",
    thumbnailImageUrl: "",
    coverImageUrl: "",
    seriesId: 0,
    date: newDate,
    label: "",
    publisher: "",
    pageCount: 0,
  };
}
