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
  {
    plugins: {
      perfectionist,
    },
    rules: {
      "perfectionist/sort-array-includes": "warn",
      // "perfectionist/sort-astro-attributes": "warn",
      // "perfectionist/sort-classes": "warn",
      "perfectionist/sort-enums": "warn",
      "perfectionist/sort-exports": "warn",
      // "perfectionist/sort-imports": "warn",
      "perfectionist/sort-interfaces": "warn",
      "perfectionist/sort-intersection-types": "warn",
      // "perfectionist/sort-jsx-props": "warn",
      "perfectionist/sort-maps": "warn",
      "perfectionist/sort-named-exports": "warn",
      // "perfectionist/sort-named-imports": "warn",
      "perfectionist/sort-object-types": "warn",
      "perfectionist/sort-objects": "warn",
      "perfectionist/sort-sets": "warn",
      // "perfectionist/sort-svelte-attributes": "warn",
      "perfectionist/sort-switch-case": "warn",
      "perfectionist/sort-union-types": "warn",
      "perfectionist/sort-variable-declarations": "warn",
      // "perfectionist/sort-vue-attributes": "warn",
    },
  },
];
