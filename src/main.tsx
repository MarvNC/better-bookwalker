import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { pageType, pageTypes } from "./consts";

ReactDOM.createRoot(
  (() => {
    const app = document.createElement("div");
    document.body.prepend(app);
    return app;
  })(),
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
