import { CustomLayer, ResponsiveLine, Serie } from "@nivo/line";
import { Maximize2, Minimize2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { ProcessedBookInfo } from "@/types";
import { calendarAxis, dateLabel, day, volumeAxis } from "@/utils/seriesView";

import ChartTooltip from "./ChartTooltip";

export default function ReleaseChart({
  onSelect,
  prediction,
  primary,
  recent,
  secondary,
}: {
  onSelect: (book: ProcessedBookInfo) => void;
  prediction: Date | null;
  primary: ProcessedBookInfo[];
  recent: boolean;
  secondary: ProcessedBookInfo[];
}) {
  const pointer = useRef({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState(false);
  const all = useMemo(() => [...primary, ...secondary], [primary, secondary]);
  const last = primary[primary.length - 1];
  const maximum = Math.max(
    Date.now(),
    ...all.map((book) => book.date.valueOf()),
    prediction?.valueOf() ?? 0,
  );
  const minimum = recent
    ? maximum - 3 * 365 * day
    : Math.min(...all.map((book) => book.date.valueOf()));
  const dates = calendarAxis(minimum, maximum);
  const volumes = volumeAxis(
    Math.max(
      1,
      ...all.map((book) => book.seriesIndex),
      prediction && last ? Math.floor(last.seriesIndex) + 1 : 0,
    ),
  );
  const data: Serie[] = [
    {
      data: primary
        .filter((book) => book.date.valueOf() >= dates.min)
        .map((book) => ({ x: book.date, y: book.seriesIndex })),
      id: "current",
    },
  ];
  if (secondary.length)
    data.push({
      data: secondary
        .filter((book) => book.date.valueOf() >= dates.min)
        .map((book) => ({ x: book.date, y: book.seriesIndex })),
      id: "comparison",
    });
  const annotations: CustomLayer = ({ innerHeight, innerWidth }) => {
    const xScale = (date: Date) =>
      ((date.valueOf() - dates.min) / (dates.max - dates.min)) * innerWidth;
    const yScale = (value: number) =>
      innerHeight - (value / volumes.max) * innerHeight;
    return (
      <g pointerEvents="none">
        <line
          className="today-line"
          x1={Number(xScale(new Date()))}
          x2={Number(xScale(new Date()))}
          y1={0}
          y2={innerHeight}
        />
        <text
          fill="var(--muted)"
          fontSize={11}
          textAnchor="end"
          x={Number(xScale(new Date()))}
          y={-12}
        >
          {dateLabel(new Date())}
        </text>
        {prediction && last && (
          <g className="forecast-line">
            <line
              x1={Number(xScale(last.date))}
              x2={Number(xScale(prediction))}
              y1={Number(yScale(last.seriesIndex))}
              y2={Number(yScale(Math.floor(last.seriesIndex) + 1))}
            />
            <circle
              cx={Number(xScale(prediction))}
              cy={Number(yScale(Math.floor(last.seriesIndex) + 1))}
              r={4}
            />
          </g>
        )}
      </g>
    );
  };
  return (
    <div
      className="nivo-chart-wrap"
      onPointerMoveCapture={(event) => {
        pointer.current = { x: event.clientX, y: event.clientY };
      }}
    >
      <button
        aria-label={expanded ? "Collapse chart" : "Expand chart"}
        aria-pressed={expanded}
        className="quiet chart-expand"
        onClick={() => setExpanded(!expanded)}
        title={expanded ? "Collapse" : "Expand"}
      >
        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
      <div className="chart-scroll">
        <div className={`nivo-chart ${expanded ? "expanded" : ""}`}>
          <ResponsiveLine
            animate={!matchMedia("(prefers-reduced-motion: reduce)").matches}
            axisBottom={{
              format: (value) =>
                new Date(value).toISOString().slice(0, dates.yearOnly ? 4 : 7),
              tickPadding: 12,
              tickSize: 0,
              tickValues: dates.ticks.map((value) => new Date(value)),
            }}
            axisLeft={{
              tickPadding: 12,
              tickSize: 0,
              tickValues: volumes.ticks,
            }}
            colors={["var(--accent)", "var(--orange)"]}
            crosshairType="x"
            curve="linear"
            data={data}
            enableCrosshair
            enableGridX
            enableGridY
            enableTouchCrosshair
            gridXValues={dates.ticks.map((value) => new Date(value))}
            gridYValues={volumes.ticks}
            layers={[
              "grid",
              "axes",
              "lines",
              "points",
              annotations,
              "crosshair",
              "mesh",
            ]}
            lineWidth={2}
            margin={{ bottom: 40, left: 42, right: 25, top: 42 }}
            motionConfig="gentle"
            onClick={(point) => {
              const source =
                point.serieId === "comparison" ? secondary : primary;
              const book = source.find(
                (item) =>
                  item.date.valueOf() === new Date(point.data.x).valueOf() &&
                  item.seriesIndex === Number(point.data.y),
              );
              if (book) onSelect(book);
            }}
            pointBorderColor={{ from: "serieColor" }}
            pointBorderWidth={1}
            pointSize={6}
            role="img"
            theme={{
              crosshair: {
                line: {
                  stroke: "var(--muted)",
                  strokeDasharray: "4 4",
                  strokeWidth: 1,
                },
              },
              grid: { line: { stroke: "var(--line)", strokeWidth: 1 } },
              text: {
                fill: "var(--muted)",
                fontFamily: "inherit",
                fontSize: 12,
              },
            }}
            tooltip={({ point }) => {
              const timestamp = new Date(point.data.x).valueOf();
              return (
                <ChartTooltip pointer={pointer}>
                  <strong>{dateLabel(new Date(timestamp))}</strong>
                  {[primary, secondary].flatMap((items, index) =>
                    items
                      .filter((book) => book.date.valueOf() === timestamp)
                      .map((book) => (
                        <div key={`${index}:${book.uuid}`}>
                          <b
                            style={{
                              color: index ? "var(--orange)" : "var(--accent)",
                            }}
                          >
                            #{book.seriesIndex}
                          </b>
                          <span>{book.title}</span>
                        </div>
                      )),
                  )}
                </ChartTooltip>
              );
            }}
            useMesh
            xFormat="time:%Y-%m-%d"
            xScale={{
              format: "native",
              max: new Date(dates.max),
              min: new Date(dates.min),
              precision: "day",
              type: "time",
              useUTC: true,
            }}
            yScale={{ max: volumes.max, min: 0, type: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
