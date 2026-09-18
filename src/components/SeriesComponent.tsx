import {
  Calculator,
  Info,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useBookOverrides } from "@/hooks/useBookOverrides";
import { useSeriesData } from "@/hooks/useSeriesData";
import { ProcessedBookInfo } from "@/types";
import { compareSeries } from "@/utils/bookwalker/compareSeries";
import { Series } from "@/utils/bookwalker/series";

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
    series,
  } = useSeriesData(location.href);
  const { apply, books, overrides } = useBookOverrides(source);
  const [editing, setEditing] = useState(false);
  const [compare, setCompare] = useState(false);
  const [comparison, setComparison] = useState<{
    books: ProcessedBookInfo[];
    title: string;
  }>({ books: [], title: "" });
  const [otherSeries, setOtherSeries] = useState<null | Series>(null);
  const [catchUpMessage, setCatchUpMessage] = useState("");
  const [catchUpLoading, setCatchUpLoading] = useState(false);
  const predictionRun = useRef(0);
  const [projection, setProjection] = useState<{
    primary: ProcessedBookInfo[];
    secondary: ProcessedBookInfo[];
  }>({ primary: [], secondary: [] });
  useEffect(
    () => () => {
      predictionRun.current++;
    },
    [],
  );
  const clearProjection = () => {
    predictionRun.current++;
    setProjection({ primary: [], secondary: [] });
    setCatchUpMessage("");
    setCatchUpLoading(false);
  };
  const pages = books.filter((book) => book.pageCount > 0);

  const handleComparisonChange = (candidate: Series) => {
    clearProjection();
    setOtherSeries(candidate);
    setComparison({
      books: candidate.booksInfo,
      title: candidate.seriesInfo?.seriesName ?? "",
    });
  };

  const runCatchUp = async () => {
    if (!series || !otherSeries || catchUpLoading) return;
    const run = ++predictionRun.current;
    setProjection({ primary: [], secondary: [] });
    setCatchUpLoading(true);
    setCatchUpMessage("");
    try {
      await compareSeries(
        series,
        otherSeries,
        setCatchUpMessage,
        (primary, secondary) => {
          if (predictionRun.current === run)
            setProjection({ primary, secondary });
        },
        () => predictionRun.current !== run,
      );
    } catch (cause) {
      setCatchUpMessage(
        cause instanceof Error
          ? cause.message
          : "Could not estimate the catch-up point.",
      );
    } finally {
      if (predictionRun.current === run) setCatchUpLoading(false);
    }
  };

  return (
    <main className="content">
      {error && (
        <div className="notice" role="alert">
          {error}
          <button
            disabled={loading}
            onClick={() => {
              clearProjection();
              void refresh();
            }}
          >
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
          <button aria-expanded={compare} onClick={() => setCompare(!compare)}>
            Compare series
          </button>
        </div>
        {compare && <SeriesComparison onChange={handleComparisonChange} />}
        {comparison.title && (
          <div className="comparison-label">
            <span>{comparison.title}</span>
            <div className="comparison-actions">
              <button
                className="primary"
                disabled={!series || !otherSeries || catchUpLoading}
                onClick={() => void runCatchUp()}
              >
                <Calculator size={15} />
                {catchUpLoading ? "Calculating…" : "Predict catch-up"}
              </button>
              <button
                aria-label="Reset catch-up prediction"
                disabled={catchUpLoading}
                onClick={clearProjection}
                title="Reset predicted volumes"
              >
                <RotateCcw size={15} />
              </button>
              <button
                aria-label="Remove comparison"
                onClick={() => {
                  clearProjection();
                  setOtherSeries(null);
                  setComparison({ books: [], title: "" });
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        {catchUpMessage && (
          <p className="comparison-feedback" role="status">
            {catchUpMessage}
          </p>
        )}
        <ReleaseHistory
          books={[...books, ...projection.primary]}
          otherBooks={[...comparison.books, ...projection.secondary]}
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
          onClick={() => {
            clearProjection();
            void refresh();
          }}
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
          onApply={(values) => {
            clearProjection();
            apply(values);
          }}
          onClose={() => setEditing(false)}
          source={source}
        />
      )}
    </main>
  );
}
