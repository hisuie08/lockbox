import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "src/components/base"]),

  {
    files: ["**/*.{ts,vue}"],

    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      ...pluginVue.configs["flat/recommended"],
    ],

    languageOptions: {
      globals: globals.browser,
    },
  },
]);
