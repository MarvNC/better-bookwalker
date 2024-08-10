import { useEffect, useState } from "react";
import { pageType, pageTypes } from "./consts";
import Series from "./components/Series";
import Book from "./components/Book";

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
    <div className="max-w-[900px] rounded-md bg-sky-100 p-10 text-left font-sans">
      {currentPageType === pageType.series ? <Series /> : null}
      {currentPageType === pageType.book ? <Book /> : null}
    </div>
  );
}
