import CopyToClipboard from "react-copy-to-clipboard";
import { toast } from "react-toastify";

import { BookInfo, bookPageUrl } from "@/consts";
import { getDate } from "@/utils/getMetaInfo";

export default function BookCard({ bookInfo }: { bookInfo: BookInfo }) {
  const date = getDate(bookInfo);
  return (
    <div className="flex rounded-md bg-white p-4 shadow-md">
      <a
        className="h-48 w-32 flex-shrink-0 rounded-md"
        href={bookPageUrl(bookInfo.uuid)}
      >
        <img
          alt={bookInfo.title}
          className="h-full w-full object-cover"
          src={bookInfo.thumbnailImageUrl}
        />
      </a>
      <div className="ml-4 flex flex-col justify-between">
        <h2 className="text-xl text-sky-800">
          <span className="mr-2 text-sky-500">#{bookInfo.seriesIndex}</span>
          <CopyToClipboard
            onCopy={() => toast.success("Title copied to clipboard!")}
            text={bookInfo.title}
          >
            <span className="cursor-pointer">{bookInfo.title}</span>
          </CopyToClipboard>
        </h2>

        <div>
          <p className="text-m flex items-center font-light text-sky-800">
            <span className="material-icons mr-1">calendar_today</span>
            <CopyToClipboard
              onCopy={() => toast.success("Date copied to clipboard!")}
              text={date}
            >
              <span className="cursor-pointer">{date}</span>
            </CopyToClipboard>
          </p>
          <p className="text-m flex items-center font-light text-sky-800">
            <span className="material-icons mr-1">menu_book</span>
            <span className="rounded">{bookInfo.pageCount}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
