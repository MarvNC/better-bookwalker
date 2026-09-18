import { SlidersHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { ChartNumbering } from "@/utils/seriesView";

export default function ChartOptions({
  numbering,
  onNumbering,
  onToday,
  recommended,
  showToday,
}: {
  numbering: ChartNumbering;
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
    const outside = (event: Event) => {
      if (!event.composedPath().includes(root.current!)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);
  return (
    <div
      className="chart-options"
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
        <SlidersHorizontal size={15} /> Display
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
              <span>Show today</span>
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
                Volume number
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
                Sequential{recommended && <em>Recommended</em>}
                <small>Count 1, 2, 3… across parts, oldest first.</small>
              </span>
            </label>
          </fieldset>
        </div>
      )}
    </div>
  );
}
