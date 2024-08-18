import { Book, BookOpenText, CalendarCheck } from "lucide-react";
import CopyToClipboard from "react-copy-to-clipboard";
import { toast } from "react-toastify";

import { bookPageUrl } from "@/consts";
import { ProcessedBookInfo } from "@/types";
import { formatDate } from "@/utils/processInfo";

export default function BookCard({
  bookInfo,
}: {
  bookInfo: ProcessedBookInfo;
}) {
  if (
    bookInfo.pageCount === 0 &&
    bookInfo.title.startsWith("Predicted Volume")
  ) {
    return null;
  }
  const dateString = formatDate(bookInfo.date);
  return (
    <div className="flex rounded-lg bg-white p-4 shadow-md">
      <a
        className="h-48 w-32 flex-shrink-0 rounded-lg"
        href={bookPageUrl(bookInfo.uuid)}
      >
        {bookInfo.thumbnailImageUrl ? (
          <img
            alt={bookInfo.title}
            className="h-full w-full object-cover"
            src={bookInfo.thumbnailImageUrl}
          />
        ) : (
          <Book className="h-full w-full text-slate-400" />
        )}
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

        <div className="flex flex-col gap-2">
          <p className="text-m flex items-center gap-2 font-light text-sky-800">
            <CalendarCheck size={20} />
            <CopyToClipboard
              onCopy={() => toast.success("Date copied to clipboard!")}
              text={dateString}
            >
              <span className="cursor-pointer">{dateString}</span>
            </CopyToClipboard>
          </p>
          <p className="text-m flex items-center gap-2 font-light text-sky-800">
            <BookOpenText size={20} />
            <span className="rounded">{bookInfo.pageCount}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
