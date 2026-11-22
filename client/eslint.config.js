import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import oxlint from "eslint-plugin-oxlint";

const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL(".", import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

// 既存の推奨ルールを維持したまま flat config に変換する。
const baseConfig = compat.config({
  "ignorePatterns": [
    "dist",
    "coverage"
  ],
  "overrides": [
    {
      "files": [
        "**/*.{js,jsx}"
      ],
      "extends": [
        "eslint:recommended",
        "plugin:react-hooks/recommended"
      ],
      "env": {
        "browser": true,
        "es2021": true
      },
      "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "ecmaFeatures": {
          "jsx": true
        }
      },
      "rules": {
        "no-unused-vars": [
          "error",
          {
            "varsIgnorePattern": "^[A-Z_]"
          }
        ]
      }
    },
    {
      "files": [
        "**/*.{ts,tsx}"
      ],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "project": [
          "./tsconfig.json"
        ]
      },
      "extends": [
        "plugin:@typescript-eslint/recommended"
      ],
      "rules": {
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            "varsIgnorePattern": "^[A-Z_]"
          }
        ]
      }
    }
  ]
});

// oxlint が担当するルールを ESLint 側で無効化する（重複検査の防止）。
// oxlint 側の設定は .oxlintrc.jsonc を参照する。
const dirname = path.dirname(fileURLToPath(import.meta.url));
export default [
  ...baseConfig,
  ...oxlint.buildFromOxlintConfigFile(path.join(dirname, ".oxlintrc.jsonc")),
];
