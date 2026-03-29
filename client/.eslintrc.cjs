module.exports = {
  root: true,
  ignorePatterns: ["dist", "coverage"],
  overrides: [
    {
      files: ["**/*.{js,jsx}"],
      extends: ["eslint:recommended", "plugin:react-hooks/recommended"],
      env: {
        browser: true,
        es2021: true,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
      },
    },
    {
      files: ["**/*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        projectService: true,
      },
      extends: ["plugin:@typescript-eslint/recommended"],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          { varsIgnorePattern: "^[A-Z_]" },
        ],
      },
    },
  ],
};
