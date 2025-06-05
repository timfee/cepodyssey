import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import tsdoc from "eslint-plugin-tsdoc";
import security from "eslint-plugin-security";
import sonar from "eslint-plugin-sonarjs";

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
    "plugin:promise/recommended",
  ),
  security.configs.recommended,
  sonar.configs.recommended,
  {
    plugins: {
      tsdoc,
    },
    rules: {
      "react-redux/useSelector-prefer-selectors": "off",
      "tsdoc/syntax": "warn",
      "sonarjs/cognitive-complexity": ["warn", 20],
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
