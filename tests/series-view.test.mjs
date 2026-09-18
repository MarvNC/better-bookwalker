import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
const source = ts.transpileModule(
  readFileSync(new URL("../src/utils/seriesView.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { calendarAxis, volumeAxis, dateLabel, datedBooks, releaseStats } =
  await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
const book = (number, date, title = "300 years killing slimes") => ({
  seriesIndex: number,
  date: new Date(date),
  title,
});
test("dates are ISO calendar dates and missing data stays missing", () => {
  assert.equal(dateLabel(new Date("2026-03-31T00:00:00Z")), "2026-03-31");
  assert.equal(dateLabel(new Date(NaN)), "—");
});
test("fractional and same-day listings are never merged or renumbered", () => {
  const data = [
    book(9, "2024-10-02"),
    book(9.5, "2024-10-02", "Special edition"),
    book(10, "2025-04-02"),
  ];
  assert.deepEqual(
    datedBooks(data).map((b) => b.seriesIndex),
    [9, 9.5, 10],
  );
  assert.equal(releaseStats(data).intervals.length, 1);
});
test("missing and future releases do not contaminate cadence", () => {
  const data = [
    book(1, "2020-01-01"),
    book(2, "2020-01-11"),
    book(3, "2099-01-01"),
    book(4, "invalid"),
  ];
  assert.equal(releaseStats(data).pace, 10);
  assert.equal(datedBooks(data).length, 3);
});
test("short and long series use regular whole-number ticks", () => {
  for (const max of [1, 2, 12.5, 104, 1000]) {
    const axis = volumeAxis(max);
    assert.ok(axis.max >= max);
    const step = axis.ticks[1] - axis.ticks[0];
    assert.ok(Number.isInteger(step));
    assert.ok(
      axis.ticks.every(
        (value, index) => index === 0 || value - axis.ticks[index - 1] === step,
      ),
    );
  }
  assert.ok(volumeAxis(1, true).max > volumeAxis(1).max);
  assert.ok(volumeAxis(12.5, true).max > volumeAxis(12.5).max);
});
test("calendar ticks align with month boundaries at every span", () => {
  for (const years of [1, 3, 7, 30, 100]) {
    const min = Date.UTC(2000, 4, 17),
      max = Date.UTC(2000 + years, 8, 20);
    const axis = calendarAxis(min, max);
    assert.ok(axis.min <= min && axis.max >= max);
    assert.ok(axis.ticks.length <= 12);
    const months = axis.ticks.map((value) => {
      const d = new Date(value);
      assert.equal(d.getUTCDate(), 1);
      return d.getUTCFullYear() * 12 + d.getUTCMonth();
    });
    const step = months[1] - months[0];
    assert.ok(
      months.every(
        (value, index) => index === 0 || value - months[index - 1] === step,
      ),
    );
  }
});
