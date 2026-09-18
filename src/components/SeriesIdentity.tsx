import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

import { bookwalkerJpSearchUrl } from "@/consts";
import { ProcessedBookInfo, SeriesInfo } from "@/types";
import { datedBooks, dateLabel } from "@/utils/seriesView";

import CopyText from "./CopyText";

export function jumpTo(id: string) {
  document
    .getElementById("better-bookwalker")
    ?.shadowRoot?.getElementById(id)
    ?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
}
export default function SeriesIdentity({
  books,
  info,
  loading,
}: {
  books: ProcessedBookInfo[];
  info: null | SeriesInfo;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const dated = datedBooks(books);
  const cover = books.find(
    (book) => book.thumbnailImageUrl || book.coverImageUrl,
  );
  return (
    <section aria-label="Series" className="series-intro">
      <div className="hero-cover">
        {cover ? (
          <img
            alt={cover.title}
            src={cover.coverImageUrl || cover.thumbnailImageUrl}
          />
        ) : (
          <BookOpen size={54} />
        )}
      </div>
      <div className="intro-copy">
        <h1>{info ? <CopyText text={info.seriesName} /> : "…"}</h1>
        {info?.japaneseTitle && (
          <div className="alternate-title">
            <span lang="ja">{info.japaneseTitle}</span>
            <a
              href={bookwalkerJpSearchUrl(info.japaneseTitle)}
              rel="noreferrer"
              target="_blank"
            >
              Search BookWalker JP
              <ExternalLink size={13} />
            </a>
          </div>
        )}
        <div className="creators">
          {info?.authors.map((author) => (
            <span key={`${author.authorName}:${author.authorTypeName}`}>
              <small>{author.authorTypeName}</small>
              <CopyText text={author.authorName} />
            </span>
          ))}
        </div>
        <div className="imprint">
          {[
            ...new Set(
              [info?.publisher, info?.label].filter(
                (value): value is string => !!value,
              ),
            ),
          ].map((value) => (
            <CopyText key={value} text={value} />
          ))}
        </div>
        <div className="series-meta">
          <span>
            <BookOpen size={15} />
            {info?.bookUUIDs.length || books.length} books
          </span>
          {dated.length > 0 && (
            <time>
              {dateLabel(dated[0].date)} —{" "}
              {dateLabel(dated[dated.length - 1].date)}
            </time>
          )}
          {loading && (
            <span className="load-progress" role="status">
              {books.filter((book) => !book.pending).length}/
              {info?.bookUUIDs.length || books.length} …
            </span>
          )}
        </div>
        {info?.synopsis && (
          <div className="synopsis">
            <p className={expanded ? "" : "clamped"}>{info.synopsis}</p>
            <button
              aria-expanded={expanded}
              aria-label={
                expanded ? "Collapse description" : "Expand description"
              }
              className="quiet synopsis-toggle"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
          </div>
        )}
        <div className="intro-actions">
          <button onClick={() => jumpTo("books")}>
            <BookOpen size={16} />
            Volumes
          </button>
          <button className="primary" onClick={() => jumpTo("history")}>
            <ChartNoAxesCombined size={16} />
            Charts
          </button>
        </div>
      </div>
    </section>
  );
}
