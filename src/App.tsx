import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import SeriesComponent from "@/components/SeriesComponent";
import { preference, savePreference } from "@/utils/preferences";

export default function App() {
  const [open, setOpen] = useState(preference("autoOpen", "true") === "true");
  const [autoOpen, setAutoOpen] = useState(
    preference("autoOpen", "true") === "true",
  );
  const [visited, setVisited] = useState(open);
  const dialog = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.documentElement.style.overflow;
    dialog.current?.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      dialog.current?.close();
      document.documentElement.style.overflow = originalOverflow;
      launcher.current?.focus({ preventScroll: true });
    };
  }, [open]);
  return (
    <>
      <button
        className="launcher"
        onClick={() => {
          setVisited(true);
          setOpen(true);
        }}
        ref={launcher}
      >
        <BookOpen size={19} /> Enhanced series view <ArrowUpRight size={16} />
      </button>
      <dialog
        aria-label="Better Bookwalker series view"
        className="workspace"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        ref={dialog}
      >
        <header className="appbar">
          <div className="brand">
            <BookOpen size={22} />
            <strong>Better Bookwalker</strong>
          </div>
          <button className="quiet" onClick={() => setOpen(false)}>
            <ArrowLeft size={17} /> Back to BookWalker <kbd>Esc</kbd>
          </button>
        </header>
        {visited && <SeriesComponent />}
        <footer className="appfooter">
          <label className="auto-open-option">
            <input
              checked={autoOpen}
              onChange={(event) => {
                setAutoOpen(event.target.checked);
                savePreference("autoOpen", String(event.target.checked));
              }}
              role="switch"
              type="checkbox"
            />{" "}
            Open enhanced view automatically
          </label>
        </footer>
      </dialog>
    </>
  );
}
