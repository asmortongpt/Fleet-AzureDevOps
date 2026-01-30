import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      '*.config.js',
      '*.config.ts',
      'api/**',
      'e2e/**',
      'tests/**',
      '*.spec.ts',
      '*.spec.tsx',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // TypeScript rules - relaxed for existing codebase
      '@typescript-eslint/no-explicit-any': 'off', // Too many to fix now
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // General code quality
      'no-console': 'off', // Allow for now
      'no-debugger': 'warn',
      'no-unused-vars': 'off', // Using TS version instead
      'prefer-const': 'warn',
    },
  }
);
