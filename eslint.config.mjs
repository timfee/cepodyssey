import { FlatCompat } from "@eslint/eslintrc";
import security from "eslint-plugin-security";
import sonar from "eslint-plugin-sonarjs";
import tsdoc from "eslint-plugin-tsdoc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import custom from "./eslint/custom-rules.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      ".next",
      "out",
      "public",
      "cypress",
      "e2e",
      "playwright",
      ".turbo",
    ],
  },
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:react-redux/recommended",
    "plugin:promise/recommended"
  ),
  security.configs.recommended,
  sonar.configs.recommended,
  {
    plugins: {
      tsdoc,
      custom,
    },
    rules: {
      "react-redux/useSelector-prefer-selectors": "off",
      "tsdoc/syntax": "warn",
      // eslint-disable-next-line no-magic-numbers
      "sonarjs/cognitive-complexity": ["warn", 20],
      "custom/no-hardcoded-url": "error",
      "custom/no-raw-fetch": "error",
      "custom/no-console-log": "warn",
      "custom/no-hardcoded-admin-id": "warn",
      "no-magic-numbers": ["warn", { ignore: [-1, 0, 1] }],
    },
  },
  {
    files: ["**/__tests__/**", "test/**"],
    rules: {
      "custom/no-console-log": "off",
      "no-magic-numbers": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
