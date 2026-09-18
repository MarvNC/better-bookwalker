import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

// Load the real model without a bundler; userscript transport must stay unused.
const cache = new Map();
function moduleUrl(file) {
  if (cache.has(file.href)) return cache.get(file.href);
  let source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  source = source.replace(/from (["'])([^"']+)\1/g, (_, quote, specifier) => {
    if (specifier === "$")
      return `from "data:text/javascript,export const GM = new Proxy({}, {get(){throw Error('Unexpected transport access')}})"`;
    const target = specifier.startsWith("@/")
      ? new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url)
      : new URL(`${specifier}.ts`, file);
    return `from "${moduleUrl(target)}"`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  cache.set(file.href, url);
  return url;
}
const { Series } = await import(
  moduleUrl(new URL("../src/utils/bookwalker/series.ts", import.meta.url))
);
const { compareSeries } = await import(
  moduleUrl(
    new URL("../src/utils/bookwalker/compareSeries.ts", import.meta.url),
  )
);
const book = (number, date) => ({
  uuid: String(number),
  seriesIndex: number,
  date: new Date(date),
  title: `Volume ${number}`,
});
test("catch-up projects without adding synthetic volumes to source models", async () => {
  const a = new Series("https://bookwalker.com/series/a");
  const b = new Series("https://bookwalker.com/series/b");
  a.booksInfo = [book(1, "2020-01-01"), book(2, "2020-01-11")];
  b.booksInfo = [
    book(1, "2020-01-01"),
    book(2, "2020-01-21"),
    book(3, "2020-02-10"),
  ];
  const before = JSON.stringify([a.booksInfo, b.booksInfo]);
  let notifications = 0;
  a.registerBooksCallback(() => notifications++);
  b.registerBooksCallback(() => notifications++);
  let projected = [];
  let message = "";
  await compareSeries(
    a,
    b,
    (text) => {
      message = text;
    },
    (primary, secondary) => {
      projected = [...primary, ...secondary];
    },
  );
  assert.equal(JSON.stringify([a.booksInfo, b.booksInfo]), before);
  assert.equal(notifications, 0);
  assert.ok(projected.length > 0);
  assert.ok(projected.every((book) => book.predicted));
  assert.match(message, /Catch up predicted/);
});
test("cancelled projections emit no updates", async () => {
  const a = new Series("https://bookwalker.com/series/a");
  a.booksInfo = [book(1, "2020-01-01"), book(2, "2020-01-11")];
  await compareSeries(
    a,
    a,
    () => assert.fail("Unexpected feedback"),
    () => assert.fail("Unexpected projection"),
    () => true,
  );
});
