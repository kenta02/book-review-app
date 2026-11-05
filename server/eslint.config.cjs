const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

// 既存ルールを維持し、ESLint 10 対応の import プラグインへ移行する。
module.exports = compat.config({
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import-x/recommended",
    "plugin:import-x/typescript",
    "prettier"
  ],
  "plugins": [
    "@typescript-eslint",
    "import-x",
    "unused-imports"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "no-var": "error",
    "prefer-const": "error",
    "no-console": [
      "warn",
      {
        "allow": [
          "warn",
          "error",
          "info",
          "debug"
        ]
      }
    ],
    "unused-imports/no-unused-imports": "error",
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-ignore": "allow-with-description"
      }
    ],
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/no-unsupported-ts-version": "off",
    "import-x/order": [
      "warn",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          [
            "parent",
            "sibling",
            "index"
          ]
        ],
        "newlines-between": "always"
      }
    ]
  },
  "settings": {
    "import-x/resolver": {
      "node": {
        "extensions": [
          ".js",
          ".ts"
        ]
      },
      "typescript": {}
    }
  },
  "ignorePatterns": [
    "node_modules/",
    "dist/",
    "coverage/"
  ]
});
