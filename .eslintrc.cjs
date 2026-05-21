/**
 * ESLint configuration — TypeScript + React (Vite).
 *
 * Classic config format (ESLint 8). This codebase was unlinted for a long
 * time, so the baseline is intentionally pragmatic: correctness rules that
 * catch real bugs are kept; purely stylistic / high-noise rules are relaxed
 * so `npm run lint` is a meaningful, green gate for *new* code rather than a
 * wall of pre-existing debt. Tighten incrementally.
 */
module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: [
    'dist',
    'build',
    'node_modules',
    'public',
    'docs',
    '*.config.js',
    '*.config.ts',
    '*.config.cjs',
    '.eslintrc.cjs',
  ],
  rules: {
    // --- correctness: keep strict ---
    'react-hooks/rules-of-hooks': 'error',

    // --- pragmatic baseline for a first-time lint ---
    'react-hooks/exhaustive-deps': 'off',
    'react-refresh/only-export-components': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any-in-catch': 'off',
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-constant-condition': ['warn', { checkLoops: false }],
  },
};
