import { Info, RefreshCw, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { useBookOverrides } from "@/hooks/useBookOverrides";
import { useSeriesData } from "@/hooks/useSeriesData";
import { ProcessedBookInfo } from "@/types";

import BookCollection from "./BookCollection";
import DataCorrections from "./DataCorrections";
import ReleaseHistory from "./ReleaseHistory";
import SeriesComparison from "./SeriesComparison";
import SeriesIdentity, { jumpTo } from "./SeriesIdentity";

export default function SeriesComponent() {
  const {
    books: source,
    error,
    info,
    loading,
    refresh,
  } = useSeriesData(location.href);
  const { apply, books, overrides } = useBookOverrides(source);
  const [editing, setEditing] = useState(false);
  const [compare, setCompare] = useState(false);
  const [comparison, setComparison] = useState<{
    books: ProcessedBookInfo[];
    title: string;
  }>({ books: [], title: "" });
  const pages = books.filter((book) => book.pageCount > 0);
  return (
    <main className="content">
      {error && (
        <div className="notice" role="alert">
          {error}
          <button disabled={loading} onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}
      <SeriesIdentity books={books} info={info} loading={loading} />
      <BookCollection
        books={books}
        onCorrect={() => {
          setEditing(true);
          requestAnimationFrame(() => jumpTo("corrections"));
        }}
      />
      <section className="section history" id="history">
        <div className="section-heading">
          <h2>Release history</h2>
          <button aria-expanded={compare} onClick={() => setCompare(!compare)}>
            Compare series
          </button>
        </div>
        {compare && (
          <SeriesComparison
            onChange={(items, title) => setComparison({ books: items, title })}
          />
        )}
        {comparison.title && (
          <div className="comparison-label">
            <span>{comparison.title}</span>
            <button
              aria-label="Remove comparison"
              onClick={() => setComparison({ books: [], title: "" })}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <ReleaseHistory
          books={books}
          otherBooks={comparison.books}
          otherTitle={comparison.title}
          seriesTitle={info?.seriesName ?? ""}
        />
        {pages.length > 0 && (
          <p className="page-total">
            {pages
              .reduce((sum, book) => sum + book.pageCount, 0)
              .toLocaleString()}{" "}
            p. · {pages.length}/{books.length} books{" "}
            <span title="Includes all listings with page counts, including alternate editions">
              <Info aria-label="Includes alternate editions" size={13} />
            </span>
          </p>
        )}
      </section>
      <div className="source-tools" id="corrections">
        <p>
          Refresh reloads book details. Correct data fixes parsed numbers or
          dates; your changes stay in this browser.
        </p>
        <button
          className="quiet"
          disabled={loading}
          onClick={() => void refresh()}
        >
          <RefreshCw size={15} />
          {loading ? "…" : "Refresh data"}
        </button>
        <button
          aria-expanded={editing}
          className="quiet"
          onClick={() => setEditing(!editing)}
        >
          <SlidersHorizontal size={15} />
          Correct data
          {Object.keys(overrides).length
            ? ` (${Object.keys(overrides).length})`
            : ""}
        </button>
      </div>
      {editing && (
        <DataCorrections
          books={books}
          onApply={apply}
          onClose={() => setEditing(false)}
          source={source}
        />
      )}
    </main>
  );
}
