import { ArrowUpRight, Maximize2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { bookPageUrl } from "@/consts";
import { ProcessedBookInfo } from "@/types";
import { preference, savePreference } from "@/utils/preferences";
import {
  ChartBook,
  chartBooks,
  ChartNumbering,
  datedBooks,
  dateLabel,
  recommendsSequential,
  releaseStats,
} from "@/utils/seriesView";

import ChartOptions from "./ChartOptions";
import ReleaseChart from "./ReleaseChart";

export default function ReleaseHistory({
  books,
  otherBooks,
  otherTitle,
  seriesTitle,
}: {
  books: ProcessedBookInfo[];
  otherBooks: ProcessedBookInfo[];
  otherTitle: string;
  seriesTitle: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState<HTMLDialogElement | null>(null);
  const enlarge = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!expanded || !modal) return;
    modal.showModal();
    return () => {
      modal.close();
      enlarge.current?.focus({ preventScroll: true });
    };
  }, [expanded, modal]);
  const [forecast, setForecast] = useState(false);
  const [table, setTable] = useState(false);
  const [recent, setRecent] = useState(false);
  const [selectedBook, setSelected] = useState<ChartBook | null>(null);
  const [showToday, setShowToday] = useState(
    () => preference("chart:today", "true") === "true",
  );
  const [savedModes, setSavedModes] = useState<Record<string, ChartNumbering>>(
    {},
  );
  const seriesKey = `${location.hostname}:${books[0]?.seriesId ?? ""}`;
  const stored =
    savedModes[seriesKey] ?? preference(`chart:numbering:${seriesKey}`, "auto");
  const recommended = recommendsSequential(books);
  const numbering: ChartNumbering =
    stored === "source" || stored === "sequential"
      ? stored
      : recommended
        ? "sequential"
        : "source";
  const primary = chartBooks(books, numbering);
  const secondary = chartBooks(otherBooks, numbering);
  const selected =
    selectedBook &&
    [...primary, ...secondary].find(
      (book) =>
        book.uuid === selectedBook.uuid &&
        book.seriesId === selectedBook.seriesId,
    );
  const stats = releaseStats(books.filter((book) => !book.predicted));
  const prediction =
    stats.next &&
    stats.next.valueOf() > Date.now() &&
    !primary.some((book) => book.date.valueOf() > Date.now())
      ? stats.next
      : null;
  const content = (
    <div className="timeline">
      <header className="timeline-heading">
        <h2 id={titleId}>
          {seriesTitle ? `${seriesTitle} Release Timeline` : "Release Timeline"}
        </h2>
        {expanded ? (
          <button
            aria-label="Close enlarged chart"
            className="quiet"
            onClick={() => setExpanded(false)}
          >
            <X size={20} />
          </button>
        ) : (
          <button
            className="quiet"
            onClick={() => setExpanded(true)}
            ref={enlarge}
          >
            <Maximize2 size={16} /> Enlarge
          </button>
        )}
      </header>
      <div className="chart-legend">
        <span>
          <i />
          {seriesTitle || "Series"}
        </span>
        {secondary.length > 0 && (
          <span>
            <i className="secondary" />
            {otherTitle}
          </span>
        )}
      </div>
      <div className="release-summary">
        <div className="chart-controls">
          {!table && (
            <ChartOptions
              numbering={numbering}
              onNumbering={(mode) => {
                setSavedModes((current) => ({ ...current, [seriesKey]: mode }));
                savePreference(`chart:numbering:${seriesKey}`, mode);
              }}
              onToday={(value) => {
                setShowToday(value);
                savePreference("chart:today", String(value));
              }}
              recommended={recommended}
              showToday={showToday}
            />
          )}
          {!table && (
            <select
              aria-label="Chart date range"
              onChange={(e) => setRecent(e.target.value === "recent")}
              value={recent ? "recent" : "all"}
            >
              <option value="all">All dates</option>
              <option value="recent">Last 3 years</option>
            </select>
          )}
          <div aria-label="Release history view" className="view-switch">
            <button aria-pressed={!table} onClick={() => setTable(false)}>
              Chart
            </button>
            <button aria-pressed={table} onClick={() => setTable(true)}>
              Release dates
            </button>
          </div>
        </div>
      </div>
      {!table && primary.length > 0 && (
        <ReleaseChart
          numbering={numbering}
          onSelect={setSelected}
          prediction={forecast ? prediction : null}
          primary={primary}
          recent={recent}
          secondary={secondary}
          showToday={showToday}
        />
      )}
      {!primary.length && (
        <p className="empty">
          {books.some((book) => book.pending) ? "…" : "No dated releases"}
        </p>
      )}
      {table && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>YYYY-MM-DD</th>
                <th>Title</th>
              </tr>
            </thead>
            <tbody>
              {datedBooks([...books, ...otherBooks])
                .sort((a, b) => a.date.valueOf() - b.date.valueOf())
                .map((book) => (
                  <tr key={`${book.seriesId}:${book.uuid}`}>
                    <td>
                      {Number.isFinite(book.seriesIndex)
                        ? book.seriesIndex
                        : "—"}
                    </td>
                    <td>{dateLabel(book.date)}</td>
                    <td>
                      {book.predicted ? (
                        <span>{book.title} · estimate</span>
                      ) : (
                        <a href={book.bookUrl ?? bookPageUrl(book.uuid)}>
                          {book.title}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && !table && (
        <div className="selected-book">
          {!selected.predicted && (
            <img
              alt=""
              src={selected.thumbnailImageUrl || selected.coverImageUrl}
            />
          )}
          <div>
            <strong>
              {numbering === "sequential" ? "Release " : "#"}
              {selected.chartIndex} · {dateLabel(selected.date)}
            </strong>
            <small>{selected.title}</small>
          </div>
          {!selected.predicted && (
            <a
              aria-label="Open book"
              href={selected.bookUrl ?? bookPageUrl(selected.uuid)}
            >
              <ArrowUpRight size={19} />
            </a>
          )}
        </div>
      )}
      {!table && (
        <footer className="timeline-forecast">
          {!forecast ? (
            <button className="quiet" onClick={() => setForecast(true)}>
              Estimate next release
            </button>
          ) : (
            <>
              <p className="forecast-note" role="status">
                {prediction
                  ? `Estimated next release · ${dateLabel(prediction)}`
                  : primary.some((book) => book.date.valueOf() > Date.now())
                    ? "A future release is already listed."
                    : stats.next
                      ? "Estimate falls in the past."
                      : "Insufficient release history."}
              </p>
              {prediction && (
                <small>
                  Based on recent release pace; not an announced date.
                </small>
              )}
              <button className="quiet" onClick={() => setForecast(false)}>
                Hide estimate
              </button>
            </>
          )}
        </footer>
      )}
    </div>
  );
  return (
    <>
      {!expanded && content}
      <dialog
        aria-labelledby={titleId}
        className="chart-dialog"
        onCancel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setExpanded(false);
        }}
        onClose={(event) => {
          event.stopPropagation();
          setExpanded(false);
        }}
        ref={setModal}
      >
        {expanded && modal && createPortal(content, modal)}
      </dialog>
    </>
  );
}
