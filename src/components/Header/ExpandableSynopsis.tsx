import { useState } from "react";

export default function ExpandableSynopsis({ synopsis }: { synopsis: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div className="mb-4 px-20 text-xl">
      {synopsis && (
        <div className="relative cursor-pointer">
          <p
            className={`${isExpanded ? "" : "line-clamp-5"}`}
            style={{ whiteSpace: "pre-wrap" }}
          >
            {synopsis}
          </p>
          <button
            className="mt-2 rounded-md border border-sky-800 p-2 font-medium text-sky-800 transition-colors duration-200 hover:border-sky-600 hover:text-sky-600"
            onClick={toggleExpanded}
          >
            {isExpanded ? "Read Less" : "Read More"}
          </button>
        </div>
      )}
    </div>
  );
}
