import {
  ArrowUpRight,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";

import { bookPageUrl } from "@/consts";
import { ProcessedBookInfo } from "@/types";
import { preference, savePreference } from "@/utils/preferences";
import { dateLabel } from "@/utils/seriesView";

export default function BookCollection({
  books,
  onCorrect,
}: {
  books: ProcessedBookInfo[];
  onCorrect: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("volume");
  const [view, setView] = useState(preference("view", "covers"));
  const visible = books
    .filter((book) =>
      `${book.title} ${book.seriesIndex}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "newest"
        ? (Number.isFinite(b.date.valueOf()) ? b.date.valueOf() : 0) -
          (Number.isFinite(a.date.valueOf()) ? a.date.valueOf() : 0)
        : (Number.isFinite(a.seriesIndex) ? a.seriesIndex : Infinity) -
          (Number.isFinite(b.seriesIndex) ? b.seriesIndex : Infinity),
    );
  return (
    <section className="section" id="books">
      <div className="section-heading">
        <h2>
          Volumes <span>{books.length}</span>
        </h2>
        <div className="view-switch">
          {(
            [
              { Icon: Grid2X2, label: "Cover view", name: "covers" },
              { Icon: List, label: "Detailed list", name: "list" },
            ] as const
          ).map(({ Icon, label, name }) => (
            <button
              aria-label={label}
              aria-pressed={view === name}
              key={name}
              onClick={() => {
                setView(name);
                savePreference("view", name);
              }}
              title={label}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>
      <div className="book-tools">
        <button className="quiet correct-entry" onClick={onCorrect}>
          <SlidersHorizontal size={15} />
          Correct data
        </button>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Find a volume"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            value={query}
          />
          {query && (
            <button
              aria-label="Clear search"
              className="quiet"
              onClick={() => setQuery("")}
            >
              <X size={16} />
            </button>
          )}
        </label>
        <select
          aria-label="Sort volumes"
          onChange={(e) => setSort(e.target.value)}
          value={sort}
        >
          <option value="volume">Volume ↑</option>
          <option value="newest">Date ↓</option>
        </select>
      </div>
      {visible.length === 0 && <p className="empty">No matches</p>}
      <div className={view === "covers" ? "book-grid" : "book-list"}>
        {visible.map((book) => (
          <article className="volume" key={book.uuid}>
            <a
              className="book-cover"
              href={book.bookUrl ?? bookPageUrl(book.uuid)}
            >
              <img
                alt={book.title}
                loading="lazy"
                src={book.coverImageUrl || book.thumbnailImageUrl}
              />
            </a>
            <div className="book-info">
              <a
                className="volume-title"
                href={book.bookUrl ?? bookPageUrl(book.uuid)}
              >
                {Number.isFinite(book.seriesIndex)
                  ? `#${book.seriesIndex}`
                  : "—"}
                <ArrowUpRight size={14} />
              </a>
              <a
                className="book-title-detail"
                href={book.bookUrl ?? bookPageUrl(book.uuid)}
              >
                <span className="title-clamp">{book.title}</span>
                <span aria-hidden="true" className="title-preview">
                  {book.title}
                </span>
              </a>
              <time
                dateTime={
                  dateLabel(book.date) === "—"
                    ? undefined
                    : dateLabel(book.date)
                }
              >
                {dateLabel(book.date)}
              </time>
              {book.pageCount > 0 && (
                <span className="pages">
                  {book.pageCount.toLocaleString()} p.
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
