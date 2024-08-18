import { useEffect, useState } from "react";
// import Book from "./components/BookHeader";
import { ToastContainer } from "react-toastify";

import SeriesComponent from "./components/SeriesComponent";
import { pageType, pageTypes } from "./consts";

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
      {currentPageType !== null &&
      currentPageType in pageType &&
      // TODO: add books
      currentPageType !== pageType.book ? (
        <>
          <div className="rounded-lg bg-sky-100 p-16 px-28 text-left font-sans">
            <div className="mx-auto max-w-[1300px]">
              {currentPageType === pageType.series ? <SeriesComponent /> : null}
              {/* {currentPageType === pageType.book ? <Book /> : null} */}
            </div>
          </div>
          <ToastContainer
            autoClose={500}
            bodyClassName="text-sky-800"
            className="w-64"
            pauseOnHover={false}
            progressClassName="bg-sky-500"
            toastClassName="text-sky-800 bg-white border border-sky-500/20 rounded-lg"
          />
        </>
      ) : null}
    </>
  );
}
