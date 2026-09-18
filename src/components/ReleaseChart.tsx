import { CustomLayer, ResponsiveLine, Serie } from "@nivo/line";
import { Maximize2, Minimize2 } from "lucide-react";
import { type RefObject, useMemo, useRef, useState } from "react";

import {
  calendarAxis,
  ChartBook,
  ChartNumbering,
  dateLabel,
  day,
  volumeAxis,
} from "@/utils/seriesView";

// Data geometry updates atomically. Nivo's independent path and point springs
// can disagree while comparison data streams in or chart scales change.
const releaseGeometry: CustomLayer = ({ lineGenerator, points, series }) => (
  <g>
    {series.map((line) => (
      <path
        d={lineGenerator(line.data.map((item) => item.position)) ?? undefined}
        fill="none"
        key={line.id}
        stroke={line.color}
        strokeWidth={2}
      />
    ))}
    {points.map((point) => (
      <circle
        cx={point.x}
        cy={point.y}
        fill={point.serieColor}
        key={point.id}
        r={3}
        stroke={point.serieColor}
        strokeWidth={1}
      />
    ))}
  </g>
);

const chartMargin = { bottom: 40, left: 42, right: 25, top: 42 };

type NivoReleaseLineProps = {
  annotations: CustomLayer;
  containerRef: RefObject<HTMLDivElement>;
  data: Serie[];
  dates: ReturnType<typeof calendarAxis>;
  numbering: ChartNumbering;
  onSelect: (book: ChartBook) => void;
  primary: ChartBook[];
  secondary: ChartBook[];
  volumes: ReturnType<typeof volumeAxis>;
};

function NivoReleaseLine({
  annotations,
  containerRef,
  data,
  dates,
  numbering,
  onSelect,
  primary,
  secondary,
  volumes,
}: NivoReleaseLineProps) {
  const [tooltip, setTooltip] = useState<{
    timestamp: number;
    x: number;
    y: number;
  } | null>(null);
  return (
    <>
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
          releaseGeometry,
          annotations,
          "crosshair",
          "mesh",
        ]}
        lineWidth={2}
        margin={chartMargin}
        motionConfig="gentle"
        onClick={(point) => {
          const source = point.serieId === "comparison" ? secondary : primary;
          const book = source.find(
            (item) =>
              item.date.valueOf() === new Date(point.data.x).valueOf() &&
              item.chartIndex === Number(point.data.y),
          );
          if (book) onSelect(book);
        }}
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={(point, event) => {
          const timestamp = new Date(point.data.x).valueOf();
          const bounds = containerRef.current?.getBoundingClientRect();
          if (!bounds) return;
          const x = event.clientX - bounds.left;
          const y = event.clientY - bounds.top;
          setTooltip({
            timestamp,
            x,
            y,
          });
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
          text: { fill: "var(--muted)", fontFamily: "inherit", fontSize: 12 },
        }}
        tooltip={() => null}
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
      {tooltip && (
        <div
          className="nivo-tip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(14px, 14px)",
          }}
        >
          <strong>{dateLabel(new Date(tooltip.timestamp))}</strong>
          {[primary, secondary].flatMap((items, index) =>
            items
              .filter((book) => book.date.valueOf() === tooltip.timestamp)
              .map((book) => (
                <div key={`${index}:${book.uuid}`}>
                  <b
                    style={{
                      color: index ? "var(--orange)" : "var(--accent)",
                    }}
                  >
                    {numbering === "sequential" ? "Release " : "#"}
                    {book.chartIndex}
                  </b>
                  <span>{book.title}</span>
                </div>
              )),
          )}
        </div>
      )}
    </>
  );
}

export default function ReleaseChart({
  numbering,
  onSelect,
  prediction,
  primary,
  recent,
  secondary,
  showToday,
}: {
  numbering: ChartNumbering;
  onSelect: (book: ChartBook) => void;
  prediction: Date | null;
  primary: ChartBook[];
  recent: boolean;
  secondary: ChartBook[];
  showToday: boolean;
}) {
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
      ...all.map((book) => book.chartIndex),
      prediction && last ? Math.floor(last.chartIndex) + 1 : 0,
    ),
    Boolean(prediction),
  );
  const data: Serie[] = [
    {
      data: primary
        .filter((book) => book.date.valueOf() >= dates.min)
        .map((book) => ({ x: book.date, y: book.chartIndex })),
      id: "current",
    },
  ];
  if (secondary.length)
    data.push({
      data: secondary
        .filter((book) => book.date.valueOf() >= dates.min)
        .map((book) => ({ x: book.date, y: book.chartIndex })),
      id: "comparison",
    });
  const annotations: CustomLayer = ({ innerHeight, innerWidth }) => {
    const xScale = (date: Date) =>
      ((date.valueOf() - dates.min) / (dates.max - dates.min)) * innerWidth;
    const yScale = (value: number) =>
      innerHeight - (value / volumes.max) * innerHeight;
    return (
      <g pointerEvents="none">
        {showToday && Date.now() >= dates.min && Date.now() <= dates.max && (
          <g>
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
          </g>
        )}
        {prediction && last && (
          <g className="forecast-line">
            <line
              x1={Number(xScale(last.date))}
              x2={Number(xScale(prediction))}
              y1={Number(yScale(last.chartIndex))}
              y2={Number(yScale(Math.floor(last.chartIndex) + 1))}
            />
            <circle
              cx={Number(xScale(prediction))}
              cy={Number(yScale(Math.floor(last.chartIndex) + 1))}
              r={4}
            />
          </g>
        )}
      </g>
    );
  };
  const chartContainer = useRef<HTMLDivElement>(null!);
  return (
    <div className="nivo-chart-wrap">
      <button
        aria-label={expanded ? "Collapse chart" : "Expand chart"}
        aria-pressed={expanded}
        className="quiet chart-expand"
        onClick={() => setExpanded(!expanded)}
        title={expanded ? "Collapse" : "Expand"}
      >
        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
      <div
        className={`nivo-chart ${expanded ? "expanded" : ""}`}
        ref={chartContainer}
      >
        <NivoReleaseLine
          annotations={annotations}
          containerRef={chartContainer}
          data={data}
          dates={dates}
          numbering={numbering}
          onSelect={onSelect}
          primary={primary}
          secondary={secondary}
          volumes={volumes}
        />
      </div>
    </div>
  );
}
