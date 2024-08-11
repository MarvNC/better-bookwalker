import CopyToClipboard from "react-copy-to-clipboard";
import { BookInfo, bookPageUrl } from "@/consts";
import { getDate } from "@/utils/getMetaInfo";
import { toast } from "react-toastify";

export default function BookCard({ bookInfo }: { bookInfo: BookInfo }) {
  const date = getDate(bookInfo);
  return (
    <div className="flex rounded-md bg-white p-4 shadow-md">
      <a
        href={bookPageUrl(bookInfo.uuid)}
        className="h-48 w-32 flex-shrink-0 rounded-md"
      >
        <img
          src={bookInfo.thumbnailImageUrl}
          alt={bookInfo.title}
          className="h-full w-full object-cover"
        />
      </a>
      <div className="ml-4 flex flex-col justify-between">
        <h2 className="text-xl text-sky-800">
          <span className="mr-2 text-sky-500">#{bookInfo.seriesIndex}</span>
          <CopyToClipboard
            text={bookInfo.title}
            onCopy={() => toast.success("Title copied to clipboard!")}
          >
            <span className="cursor-pointer">{bookInfo.title}</span>
          </CopyToClipboard>
        </h2>

        <div>
          <p className="text-m flex items-center font-light text-sky-800">
            <span className="material-icons mr-1">calendar_today</span>
            <CopyToClipboard
              text={date}
              onCopy={() => toast.success("Date copied to clipboard!")}
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
