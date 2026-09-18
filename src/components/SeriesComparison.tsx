import { useState } from "react";

import { Series } from "@/utils/bookwalker/series";
import { preference, savePreference } from "@/utils/preferences";

export default function SeriesComparison({
  onChange,
}: {
  onChange: (series: Series) => void;
}) {
  const [url, setUrl] = useState(preference(`pair:${location.pathname}`, ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function compare(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const parsed = new URL(url.trim());
      if (
        !["bookwalker.com", "bookwalker.jp"].includes(parsed.hostname) ||
        !/^https?:$/.test(parsed.protocol) ||
        !parsed.pathname.startsWith("/series/")
      )
        throw new Error("Enter a BookWalker series URL.");
      if (
        parsed.origin === location.origin &&
        parsed.pathname.replace(/\/$/, "") ===
          location.pathname.replace(/\/$/, "")
      )
        throw new Error("Choose a different series.");
      setLoading(true);
      const series = new Series(parsed.href);
      series.registerBooksCallback(() => onChange(series));
      series.registerSeriesCallback(() => onChange(series));
      await series.fetchSeries();
      onChange(series);
      savePreference(`pair:${location.pathname}`, parsed.href);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load series.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <form className="compare-form" onSubmit={compare}>
        <label>
          Series URL
          <input
            onChange={(e) => setUrl(e.target.value)}
            required
            type="url"
            value={url}
          />
        </label>
        <button disabled={loading}>{loading ? "…" : "Compare"}</button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </>
  );
}
