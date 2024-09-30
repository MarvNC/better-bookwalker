import { Library } from "lucide-react";
import CopyToClipboard from "react-copy-to-clipboard";
import { toast } from "react-toastify";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SeriesInfo } from "@/types";
import { formatDate } from "@/utils/processInfo";

import { Separator } from "./ui/separator";

export default function SeriesHeader({
  seriesInfo,
}: {
  seriesInfo: SeriesInfo | null;
}) {
  const datesCombinedString = `${formatDate(seriesInfo?.dates.start)} - ${formatDate(seriesInfo?.dates.end)}`;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-white p-4 text-sky-800 shadow-md">
      {/* Top line */}
      <div className="flex flex-row justify-between">
        {/* Authors */}
        <div className="flex flex-row gap-10 text-2xl">
          {seriesInfo?.authors.map((author) => (
            <span key={author.authorName}>
              <span className="font-light text-slate-400">
                {/* TODO: make these clickable */}
                {author.authorTypeName}
              </span>
              <span> : </span>
              <CopyToClipboard
                onCopy={() => toast.success("Author copied to clipboard!")}
                text={author.authorName}
              >
                <span className="cursor-pointer">{author.authorName}</span>
              </CopyToClipboard>
            </span>
          ))}
        </div>
        {/* Publisher and label */}
        <div className="flex flex-row gap-5 text-xl text-sky-800">
          {seriesInfo?.publisher && <span>{seriesInfo.publisher}</span>}
          {seriesInfo?.publisher && seriesInfo?.label && <span> - </span>}
          {seriesInfo?.label && <span>{seriesInfo.label}</span>}
        </div>
      </div>

      {/* Title */}
      <HoverCard>
        <HoverCardTrigger className="flex justify-center !no-underline">
          <h1 className="text-center text-5xl font-semibold leading-normal">
            <CopyToClipboard
              onCopy={() => toast.success("Title copied to clipboard!")}
              text={seriesInfo?.seriesName ?? ""}
            >
              <span className="cursor-pointer no-underline">
                {seriesInfo?.seriesName ?? "Loading series info..."}
              </span>
            </CopyToClipboard>
          </h1>
        </HoverCardTrigger>{" "}
        <HoverCardContent className="min-w-max text-center text-3xl">
          {seriesInfo?.seriesNameKana}
        </HoverCardContent>
      </HoverCard>

      {/* Dates / Volume count */}
      {seriesInfo && (
        <div className="flex flex-row items-center gap-2 text-2xl font-light text-sky-800">
          <CopyToClipboard
            onCopy={() => toast.success("Dates copied to clipboard!")}
            text={datesCombinedString}
          >
            <span className="cursor-pointer">{datesCombinedString}</span>
          </CopyToClipboard>
          <span>・</span>
          <span className="flex items-center gap-1" title="Volume count">
            <Library />
            <span>{seriesInfo.bookUUIDs.length}</span>
          </span>
        </div>
      )}

      <Separator className="m-4" />

      {/* Synopsis */}
      {seriesInfo && seriesInfo.synopsis && seriesInfo.synopsis.length > 0 && (
        <div className="mb-4 px-24 text-xl">{seriesInfo.synopsis}</div>
      )}
    </div>
  );
}
