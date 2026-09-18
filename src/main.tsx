import React from "react";
import ReactDOM from "react-dom/client";

import App from "@/App";
import { pageTypes } from "@/consts";

import styles from "./index.css?inline";

function mountApp() {
  if (
    !pageTypes.series.regex.test(location.pathname) ||
    document.getElementById("better-bookwalker")
  )
    return;
  const host = document.createElement("div");
  host.id = "better-bookwalker";
  host.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;display:block;pointer-events:none;";
  document.documentElement.append(host);
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  shadow.append(style);
  const root = document.createElement("div");
  shadow.append(root);
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", mountApp, { once: true });
else mountApp();
