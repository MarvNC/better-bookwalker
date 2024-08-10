import { useEffect, useState } from "react";
import { pageType, pageTypes } from "./consts";
import Series from "./components/SeriesHeader";
import Book from "./components/BookHeader";

export default function App() {
  const [currentPageType, setCurrentPageType] = useState<pageType | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname.match(pageTypes.series.regex)) {
      setCurrentPageType(pageType.series);
    } else if (url.pathname.match(pageTypes.book.regex)) {
      setCurrentPageType(pageType.book);
    } else {
      throw new Error("Unknown page type");
    }
  }, []);
  if (!pageType) throw new Error("Unknown page type");
  return (
    <div className="rounded-md bg-sky-100 p-10 text-left font-sans">
      <div className="mx-auto max-w-[900px]">
        {currentPageType === pageType.series ? <Series /> : null}
        {currentPageType === pageType.book ? <Book /> : null}
      </div>
    </div>
  );
}
