import { useEffect, useState } from "react";
import { pageType, pageTypes } from "./consts";
import Series from "./components/SeriesHeader";
import Book from "./components/BookHeader";
import { ToastContainer } from "react-toastify";

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
    <>
      <div className="rounded-md bg-sky-100 p-16 text-left font-sans">
        <div className="mx-auto max-w-[1000px]">
          {currentPageType === pageType.series ? <Series /> : null}
          {currentPageType === pageType.book ? <Book /> : null}
        </div>
      </div>
      <ToastContainer
        autoClose={500}
        pauseOnHover={false}
        className="w-64"
        toastClassName="text-sky-800 bg-white border border-sky-500/20 rounded-md"
        bodyClassName="text-sky-800"
        progressClassName="bg-sky-500"
      />
    </>
  );
}
