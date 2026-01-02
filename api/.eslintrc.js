module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:security/recommended'
  ],
  plugins: [
    '@typescript-eslint',
    'security',
    'no-secrets'
  ],
  rules: {
    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-child-process': 'warn',
    'no-secrets/no-secrets': 'error',

    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern': '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '*.config.js',
    '*.config.ts'
  ]
}
