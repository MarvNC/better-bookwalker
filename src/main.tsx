import React from "react";
import ReactDOM from "react-dom/client";

import App from "@/App";
import { pageTypes } from "@/consts";

import styles from "./index.css?inline";

const navigationEvent = "better-bookwalker:navigation";
let mountedRoot: null | ReturnType<typeof ReactDOM.createRoot> = null;
let mountedUrl: null | string = null;
let lastSeenUrl: null | string = null;

function unmountApp() {
  mountedRoot?.unmount();
  mountedRoot = null;
  document.getElementById("better-bookwalker")?.remove();
}

function syncApp() {
  const url = location.href;
  lastSeenUrl = url;
  const isSeriesPage = pageTypes.series.regex.test(location.pathname);
  const host = document.getElementById("better-bookwalker");

  if (!isSeriesPage) {
    if (host || mountedRoot) unmountApp();
    mountedUrl = null;
    return;
  }

  if (mountedUrl === url && host) return;
  if (host || mountedRoot) unmountApp();

  const newHost = document.createElement("div");
  newHost.id = "better-bookwalker";
  newHost.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;display:block;pointer-events:none;";
  document.documentElement.append(newHost);
  const shadow = newHost.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  shadow.append(style);
  const root = document.createElement("div");
  shadow.append(root);
  mountedRoot = ReactDOM.createRoot(root);
  mountedRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  mountedUrl = url;
}

function notifyNavigation() {
  window.dispatchEvent(new Event(navigationEvent));
}

for (const method of ["pushState", "replaceState"] as const) {
  const original = history[method];
  history[method] = function (...args) {
    const result = original.apply(this, args);
    notifyNavigation();
    return result;
  };
}

function initializeNavigation() {
  syncApp();
  window.addEventListener(navigationEvent, syncApp);
  window.addEventListener("popstate", syncApp);
  window.addEventListener("hashchange", syncApp);

  // Some storefront transitions update the URL through framework internals
  // without a directly observable History call. Their DOM update still gives
  // us a reliable, low-cost fallback signal.
  new MutationObserver(() => {
    if (
      location.href !== lastSeenUrl ||
      (pageTypes.series.regex.test(location.pathname) &&
        !document.getElementById("better-bookwalker"))
    )
      syncApp();
  }).observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", initializeNavigation, {
    once: true,
  });
else initializeNavigation();
