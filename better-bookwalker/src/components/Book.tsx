import React from "react";
import { BookInfo } from "../consts";

const Book: React.FC<{ bookInfo: BookInfo }> = ({ bookInfo }) => {
  return <p key={bookInfo.uuid}>{bookInfo.title}</p>;
};

export default Book;
