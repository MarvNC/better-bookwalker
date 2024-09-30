import { ProcessedBookInfo } from "@/types";

export function createNewBookInfo({
  newDate,
  newTitle,
  newVolume,
}: {
  newDate: Date;
  newTitle: string;
  newVolume: number;
}): ProcessedBookInfo {
  return {
    authors: [],
    coverImageUrl: "",
    date: newDate,
    details: "",
    detailsShort: "",
    label: "",
    pageCount: 0,
    publisher: "",
    seriesId: 0,
    seriesIndex: newVolume,
    thumbnailImageUrl: "",
    title: newTitle,
    titleKana: "",
    uuid: Math.floor(Math.random() * 10000).toString(),
  };
}
