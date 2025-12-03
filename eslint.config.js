import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import storybook from 'eslint-plugin-storybook';
import security from 'eslint-plugin-security';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  {
    // Global ignores
    ignores: [
      // Dependencies
      '**/node_modules/**',

      // Build outputs
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',

      // Test outputs
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.playwright/**',

      // Config files that should be ignored
      '**/.eslintrc.cjs',
      '**/vite.config.ts',
      '**/playwright.config.ts',
      '**/*.config.js',
      '**/*.config.ts',

      // Hidden directories
      '**/.github/**',
      '**/.storybook/**',
      '**/.husky/**',
      '**/.vscode/**',
      '**/.idea/**',

      // Python environments
      '**/venv/**',
      '**/__pycache__/**',
      '**/.pytest_cache/**',

      // Logs
      '**/*.log',

      // Environment
      '**/.env',
      '**/.env.*',

      // Temporary files
      '**/*.tmp',
      '**/*.temp',

      // Other external code
      '**/api/**', // API has its own config
      '**/agent_orch/**',
      '**/azure-agents/**',
      '**/ai-agents/**',
      '**/azure-emulators/**',
      '**/azure-functions/**',
      '**/benchmarks/**',
    ],
  },
  {
    // Base config for all files
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
  },
  {
    // TypeScript and React configuration
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
      'import': importPlugin,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // React Refresh rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // React Hooks rules - CRITICAL for preventing dependency issues
      'react-hooks/rules-of-hooks': 'error',        // Enforce hooks rules
      'react-hooks/exhaustive-deps': 'warn',        // Check effect dependencies

      // Unused imports detection
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Import ordering rules
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',   // Node built-ins
            'external',  // npm packages
            'internal',  // @/ imports
            'parent',    // ../
            'sibling',   // ./
            'index'      // ./index
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        },
      ],
      'import/no-duplicates': 'warn',
      'import/no-unused-modules': 'warn',
      'import/first': 'warn',
      'import/newline-after-import': 'warn',

      // Accessibility rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/no-access-key': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/tabindex-no-positive': 'warn',

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',

      // General JavaScript rules
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Allow console in benchmark and script files
    files: ['**/benchmarks/**/*.ts', '**/scripts/**/*.{js,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Security plugin configuration
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      security,
    },
    rules: {
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
    },
  },
  // Storybook configuration
  ...storybook.configs['flat/recommended'],
);
