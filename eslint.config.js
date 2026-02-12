import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  {
    ignores: [
      '**/*',  // Ignore everything by default
      '!src/**',  // Only lint src/ directory
      'dist/**',
      'node_modules/**',
      'build/**',
      '*.config.js',
      '*.config.ts',
      'api/**',
      'api-standalone/**',
      'e2e/**',
      'tests/**',
      '*.spec.ts',
      '*.spec.tsx',
      '.venv-*/**',
      'verify-*.js',
      'test-*.js',
      'test-*.mjs',
      'capture-*.mjs',
      'capture-*.js',
      '.git/**',
      'coverage/**',
      'artifacts/**',
      'azure-*.ts',
      'azure-*.js',
      '*.d.ts',
      'public/**',
      'scripts/**',
      'incoming_zips/**',
      'check-*',
      'convert-*',
      'generate-*',
      '*-orchestrator.ts',
      'meshy-*.ts',
      'fleet-3d-*.ts',
      'screenshot-*.js',
      'quick-*.mjs',
      'grok-*.js',
      'sample-*.tsx',
      'serve.js',
      'import-*.cjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      'import': importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      // React hooks (v5 flat config compatible)
      ...reactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript rules - relaxed for existing codebase
      '@typescript-eslint/no-explicit-any': 'off', // Too many to fix now
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-extraneous-class': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-dynamic-delete': 'warn',
      '@typescript-eslint/no-useless-constructor': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-invalid-void-type': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/triple-slash-reference': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      // Note: @typescript-eslint/ban-types was removed in v8;
      // replaced by no-empty-object-type, no-unsafe-function-type,
      // and no-wrapper-object-types (all configured above)

      // General code quality
      'no-console': 'off', // Allow for now
      'no-debugger': 'warn',
      'no-unused-vars': 'off', // Using TS version instead
      'prefer-const': 'warn',
      'no-useless-catch': 'warn',
      'no-control-regex': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-prototype-builtins': 'warn',
      'no-case-declarations': 'warn',
      'no-useless-escape': 'warn',
      'no-unsafe-optional-chaining': 'warn',
      'no-constant-condition': 'warn',

      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',

      // Import ordering
      'import/no-duplicates': 'error',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
    },
  }
);
