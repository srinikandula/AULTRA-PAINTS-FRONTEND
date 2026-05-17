import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Note: `files: ['src/**/*.{ts,tsx}']` below already scopes linting to src/.
  // We still need to ignore root-level configs (tailwind, postcss, vite, server)
  // because ESLint 9 flat-config parses all matched files before applying the
  // `files` filter — so untyped root TS files would otherwise trigger parser
  // errors. `.angular/**` is excluded for the same reason during the migration window.
  {
    ignores: [
      'dist',
      'node_modules',
      '.angular/**',
      'src/app/**',
      'src/main.ts',
      'src/main.server.ts',
      'src/server.ts',
      'server.ts',
      'tailwind.config.ts',
      'postcss.config.mjs',
      'vite.config.ts',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...tseslint.configs['recommended'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // shadcn primitives intentionally export both a component and a cva instance
  // (e.g. Button + buttonVariants). Disable react-refresh only-export-components
  // for the ui/ folder to avoid warning fatigue across ~10 primitives.
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
];
