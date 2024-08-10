import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import monkey, { cdn } from "vite-plugin-monkey";

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
        },
      },
    }),
  ],
});
