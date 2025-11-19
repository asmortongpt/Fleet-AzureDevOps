# Quick Test Reference

## Run Tests

```bash
cd /home/user/Fleet/api

# Basic
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Specific
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:ci             # CI mode
```

## View Coverage

```bash
npm run test:coverage
xdg-open coverage/lcov-report/index.html
```

## Test Files

```
api/src/
├── __tests__/
│   ├── setup.ts           # Global setup
│   └── helpers.ts         # Test utilities
├── middleware/__tests__/
│   ├── auth.test.ts       # 12 tests
│   └── validation.test.ts # 15 tests
├── utils/__tests__/
│   └── apiResponse.test.ts # 20 tests
└── routes/__tests__/
    └── auth.integration.test.ts # 16 tests
```

## Test Helpers

```typescript
import {
  createMockUser,
  createAuthToken,
  mockRequest,
  mockResponse,
  mockNext
} from './__tests__/helpers';
```

## Coverage Target

- **Current**: ~3%
- **Target**: 50%+
- **Threshold**: 50% (branches, functions, lines, statements)

## Total Tests Created

- **Files**: 5 test files
- **Cases**: 63 test cases
- **Lines**: ~1,058 lines
