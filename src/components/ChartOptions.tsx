import { SlidersHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { ChartNumbering } from "@/utils/seriesView";

export default function ChartOptions({
  forecast,
  numbering,
  onForecast,
  onNumbering,
  onToday,
  recommended,
  showToday,
}: {
  forecast: boolean;
  numbering: ChartNumbering;
  onForecast: (value: boolean) => void;
  onNumbering: (value: ChartNumbering) => void;
  onToday: (value: boolean) => void;
  recommended: boolean;
  showToday: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!event.composedPath().includes(root.current!)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <div
      className="chart-options"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
      ref={root}
    >
      <button
        aria-controls={id}
        aria-expanded={open}
        className="quiet"
        onClick={() => setOpen(!open)}
        ref={trigger}
      >
        <SlidersHorizontal size={15} /> Chart options
      </button>
      {open && (
        <div className="chart-options-panel" id={id}>
          <fieldset>
            <legend>Display</legend>
            <label>
              <input
                checked={showToday}
                onChange={(e) => onToday(e.target.checked)}
                type="checkbox"
              />
              <span>
                Today marker<small>Show a vertical line at today’s date.</small>
              </span>
            </label>
            <label>
              <input
                checked={forecast}
                onChange={(e) => onForecast(e.target.checked)}
                type="checkbox"
              />
              <span>
                Estimate next release
                <small>Based on the recent release pace.</small>
              </span>
            </label>
          </fieldset>
          <fieldset>
            <legend>Chart numbering</legend>
            <label>
              <input
                checked={numbering === "source"}
                name={`${id}-numbering`}
                onChange={() => onNumbering("source")}
                type="radio"
              />
              <span>
                BookWalker numbers
                <small>Use the original volume numbers.</small>
              </span>
            </label>
            <label>
              <input
                checked={numbering === "sequential"}
                name={`${id}-numbering`}
                onChange={() => onNumbering("sequential")}
                type="radio"
              />
              <span>
                Release order{recommended && <em>Recommended</em>}
                <small>Count 1, 2, 3… across parts, oldest first.</small>
              </span>
            </label>
          </fieldset>
          <p>
            Numbering is saved for this series. Both comparison lines use the
            selected mode.
          </p>
        </div>
      )}
    </div>
  );
}
