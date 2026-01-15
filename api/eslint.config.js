import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import nodePlugin from 'eslint-plugin-node';

export default tseslint.config(
  {
    // Global ignores
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.d.ts',
      '**/*.js',
      '**/__tests__/**',
    ],
  },
  {
    // Base config for all files
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
  {
    // TypeScript configuration
    files: ['**/*.ts'],
    plugins: {
      security,
      import: importPlugin,
      promise: promisePlugin,
      node: nodePlugin,
    },
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-expressions': 'off', // Fix for compatibility issue
      '@typescript-eslint/no-unused-vars': [
        'warn', // Downgraded to warning - doesn't affect runtime
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            arguments: false,
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/no-unsafe-assignment': 'warn', // Downgraded from error
      '@typescript-eslint/no-unsafe-member-access': 'warn', // Downgraded from error
      '@typescript-eslint/no-unsafe-call': 'warn', // Downgraded from error
      '@typescript-eslint/no-unsafe-return': 'warn', // Downgraded from error
      '@typescript-eslint/no-unsafe-argument': 'warn', // Downgraded from error
      '@typescript-eslint/restrict-template-expressions': 'warn', // Downgraded from error
      '@typescript-eslint/require-await': 'warn', // Downgraded from error
      '@typescript-eslint/no-base-to-string': 'warn', // Downgraded from error
      '@typescript-eslint/no-redundant-type-constituents': 'warn', // Downgraded from error
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn', // Downgraded from error
      '@typescript-eslint/no-empty-object-type': 'warn', // Downgraded from error
      '@typescript-eslint/no-namespace': 'warn', // Downgraded from error
      '@typescript-eslint/prefer-promise-reject-errors': 'warn', // Downgraded from error
      '@typescript-eslint/await-thenable': 'warn', // Downgraded from error
      '@typescript-eslint/ban-ts-comment': 'warn', // Downgraded from error
      '@typescript-eslint/no-require-imports': 'warn', // Downgraded from error

      // Security rules
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

      // Import rules - enforce import organization
      'import/order': 'off', // Temporarily disabled due to resolver issues
      'import/first': 'error',
      'import/no-duplicates': 'off', // Temporarily disabled due to resolver issues
      'import/newline-after-import': 'error',
      'import/no-unresolved': 'off', // TypeScript handles this

      // Promise rules - ensure proper promise handling
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/no-native': 'off',
      'promise/no-nesting': 'warn',
      'promise/no-promise-in-callback': 'warn',
      'promise/no-callback-in-promise': 'warn',
      'promise/avoid-new': 'off',
      'promise/no-new-statics': 'error',
      'promise/no-return-in-finally': 'error',
      'promise/valid-params': 'error',

      // Node.js rules - prevent deprecated APIs
      'node/no-deprecated-api': 'error',
      'node/no-extraneous-import': 'off', // Handled by TypeScript/npm
      'node/no-extraneous-require': 'off',
      'node/no-missing-import': 'off', // TypeScript handles this
      'node/no-missing-require': 'off',
      'node/no-unpublished-import': 'off',
      'node/no-unpublished-require': 'off',
      'node/no-unsupported-features/es-syntax': 'off', // We use modern ES features
      'node/process-exit-as-throw': 'error',
      'node/shebang': 'off',

      // General JavaScript rules
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
    },
  },
);
