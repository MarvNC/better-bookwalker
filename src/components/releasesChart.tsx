import { BookInfo } from "@/consts";
import { getDate } from "@/utils/getMetaInfo";

export default function ReleasesChart({
  booksInfo,
}: {
  booksInfo: BookInfo[];
}) {
  console.log(booksInfo);
  const data = booksInfo.map((book) => ({
    name: book.title,
    date: getDate(book),
  }));
  console.log(data);
  return (
    <div className="rounded-lg bg-white">

    </div>
  );
}
