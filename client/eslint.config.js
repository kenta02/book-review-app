import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL(".", import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

// 既存の推奨ルールを維持したまま flat config に変換する。
export default compat.config({
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
