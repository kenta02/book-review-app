module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'import', 'unused-imports'],
  rules: {
    // Type safety
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',

    // Recommended safety / style
    'no-var': 'error',
    'prefer-const': 'error',
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],

    // Imports / unused
    'unused-imports/no-unused-imports': 'error',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        'newlines-between': 'always'
      }
    ],

    // Prevent dangerous comments / bypasses
    '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],

    // Useful strictness but not blocking developer flow
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-unsupported-ts-version': 'off'
  },
  settings: {
    'import/resolver': {
      node: { extensions: ['.js', '.ts'] },
      typescript: {}
    }
  }
};
