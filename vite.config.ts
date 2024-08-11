import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import monkey, { cdn } from "vite-plugin-monkey";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: "src/main.tsx",
      userscript: {
        name: "Better Bookwalker",
        author: "Marv",
        icon: "https://avatars.githubusercontent.com/u/17340496",
        namespace: "https://github.com/MarvNC",
        match: ["https://*.bookwalker.jp/*"],
      },
      build: {
        externalGlobals: {
          react: cdn.jsdelivr("React", "umd/react.production.min.js"),
          "react-dom": cdn.jsdelivr(
            "ReactDOM",
            "umd/react-dom.production.min.js",
          ),
          "react-copy-to-clipboard": cdn.jsdelivr(
            "reactCopyToClipboard",
            "index.min.js",
          ),
          // https://cdn.jsdelivr.net/npm/@nivo/bar@0.87.0/dist/nivo-bar.cjs.min.js
          "nivo-core": cdn.jsdelivr("nivoCore", "nivo-core.cjs.min.js"),
          // https://cdn.jsdelivr.net/npm/@nivo/line@0.87.0/dist/nivo-line.cjs.min.js
          "nivo-line": cdn.jsdelivr("nivoLine", "nivo-line.cjs.min.js"),
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
