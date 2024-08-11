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
          // https://cdn.jsdelivr.net/npm/react-copy-to-clipboard@5.1.0/build/react-copy-to-clipboard.min.js
          "react-copy-to-clipboard": cdn.jsdelivr(
            "CopyToClipboard",
            "build/react-copy-to-clipboard.min.js",
          ),
          // https://cdn.jsdelivr.net/npm/@nivo/core@0.87.0/+esm
          // "@nivo/core": cdn.jsdelivr("nivoCore"),
          // https://cdn.jsdelivr.net/npm/@nivo/line@0.87.0/+esm
          // "@nivo/line": cdn.jsdelivr("nivoLine"),
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
