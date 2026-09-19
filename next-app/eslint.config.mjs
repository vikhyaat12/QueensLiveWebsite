import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "**/node_modules/**",
    // OmniRoute is a separate vendored project with its own lint/build setup.
    "OmniRoute/**",
    "OmniRoute",
    // Data, assets, and test reports
    "data/**",
    "public/**",
    "assets-src/**",
    "scratch/**",
    "scripts/**",
    "start-server.js",
    "verify-live.mjs",
    "test-results/**",
    "playwright-report/**",
    "e2e/**",
  ]),
]);

export default eslintConfig;