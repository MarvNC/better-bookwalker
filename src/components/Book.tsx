import React from "react";
import { BookInfo } from "../consts";

const Book: React.FC<{ bookInfo: BookInfo }> = ({ bookInfo }) => {
  return (
    <div className="flex rounded-md bg-white p-4 shadow-md">
      <img
        src={bookInfo.thumbnailImageUrl}
        alt={bookInfo.title}
        className="h-48 w-32 flex-shrink-0 rounded-md object-cover"
      />
      <div className="ml-4 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sky-700">
            {bookInfo.title}
          </h2>
          <p className="text-m font-black text-sky-700">
            #{bookInfo.seriesIndex}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Book;
