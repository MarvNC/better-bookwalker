import pluginJs from "@eslint/js";
import importx from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import pluginReact from "eslint-plugin-react";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["src/components/ui/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    plugins: {
      import: importx,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "object-shorthand": ["error", "always"],
      "react/jsx-sort-props": ["warn", {}],
      "react/react-in-jsx-scope": "off",
      "simple-import-sort/exports": "warn",
      "simple-import-sort/imports": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  perfectionist.configs["recommended-alphabetical"],
];
