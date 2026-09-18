import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function CopyText({ text }: { text: string }) {
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied");
    } catch {
      setStatus("Select text to copy");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(""), 1800);
  }
  return (
    <span className="copy-text">
      <span>{text}</span>
      <button
        aria-label={`Copy ${text}`}
        className="copy-icon"
        onClick={() => void copy()}
        title={status || "Copy"}
      >
        {status === "Copied" ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <span className="sr-only" role="status">
        {status}
      </span>
    </span>
  );
}
