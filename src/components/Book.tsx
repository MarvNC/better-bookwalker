import { BookInfo } from "../consts";
import { getDate } from "../utils/getMetaInfo";

export default function Book({ bookInfo }: { bookInfo: BookInfo }) {
  const date = getDate(bookInfo);
  return (
    <div className="flex rounded-md bg-white p-4 shadow-md">
      <img
        src={bookInfo.thumbnailImageUrl}
        alt={bookInfo.title}
        className="h-48 w-32 flex-shrink-0 rounded-md object-cover"
      />
      <div className="ml-4 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sky-800">
            {bookInfo.title}
          </h2>
          <p className="text-m font-black text-sky-800">
            #{bookInfo.seriesIndex}
          </p>
          <p className="text-m text-sky-800">{date}</p>
          <p className="text-m text-sky-800">{bookInfo.pageCount} pages</p>
          <p className="text-m text-sky-800">{bookInfo.detailsShort}</p>
        </div>
      </div>
    </div>
  );
}
