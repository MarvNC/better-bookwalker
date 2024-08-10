import React from "react";
import { BookInfo } from "../consts";

const Book: React.FC<{ bookInfo: BookInfo }> = ({ bookInfo }) => {
  return (
    <div className="mb-4 rounded-md bg-white p-4 shadow-md">
      <div className="flex items-center">
        <img
          src={bookInfo.thumbnailImageUrl}
          alt={bookInfo.title}
          className="mr-4 h-24 w-16 rounded-md object-cover"
        />
        <div>
          <h2 className="text-xl font-semibold text-sky-700">
            {bookInfo.title}
          </h2>
          <p className="text-sm text-sky-500">{bookInfo.titleKana}</p>
          <p className="text-sm text-sky-700">
            Series Index: {bookInfo.seriesIndex}
          </p>
        </div>
      </div>
      <p className="mt-2 text-sky-700">{bookInfo.detailsShort}</p>
    </div>
  );
};

export default Book;
