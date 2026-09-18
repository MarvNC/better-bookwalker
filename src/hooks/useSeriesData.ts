import { useEffect, useRef, useState } from "react";

import { ProcessedBookInfo } from "@/types";
import { Series } from "@/utils/bookwalker/series";
import { scrapeSeriesPreview } from "@/utils/scrape/seriesPreview";

export function useSeriesData(url: string) {
  const [preview] = useState(() =>
    url === location.href ? scrapeSeriesPreview(document, url) : null,
  );
  const [info, setInfo] = useState(preview?.info ?? null);
  const [books, setBooks] = useState<ProcessedBookInfo[]>(preview?.books ?? []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const run = useRef<(force?: boolean) => Promise<void>>(async () => {});
  useEffect(() => {
    let active = true;
    let busy = false;
    const series = new Series(url);
    series.registerSeriesCallback((value) => {
      if (active) setInfo(value);
    });
    series.registerBooksCallback((value) => {
      if (active)
        setBooks((previous) => {
          const loaded = new Map(
            previous
              .filter((book) => !book.pending)
              .map((book) => [book.uuid, book]),
          );
          return value.map((book) =>
            book.pending && loaded.has(book.uuid)
              ? loaded.get(book.uuid)!
              : book,
          );
        });
    });
    run.current = async (force = false) => {
      if (busy) return;
      busy = true;
      setLoading(true);
      setError("");
      try {
        await series.fetchSeries(force);
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load series.",
          );
      } finally {
        busy = false;
        if (active) setLoading(false);
      }
    };
    void run.current();
    return () => {
      active = false;
    };
  }, [url]);
  return { books, error, info, loading, refresh: () => run.current(true) };
}
