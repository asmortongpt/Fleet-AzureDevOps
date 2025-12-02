# Fleet Management System - Backend Tests

## Test Suite Overview

Comprehensive testing infrastructure for the Fleet Management backend API.

### Test Categories

- **Route Tests** (`routes/`): API endpoint integration tests
- **Service Tests** (`services/`): Business logic unit tests
- **ML Model Tests** (`ml-models/`): Machine learning validation
- **Security Tests** (`security/`): Vulnerability and authorization testing
- **Migration Tests** (`migrations/`): Database schema validation
- **Performance Tests** (`performance/`): Load and stress testing

### Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test asset-management.test.ts

# Run in watch mode
npm run test:watch
```

### Test Statistics

Total test files: 8+
- Route tests: 3 files (Asset, Task, Incident Management)
- Service tests: 2 files (Alert Engine, Vehicle Identification)
- ML model tests: 1 file (Driver Scoring)
- Security tests: 1 file (Authentication & Authorization)
- Migration tests: 1 file (Database Schema)

### Coverage Targets

- Lines: 80%+
- Functions: 80%+
- Branches: 75%+
- Statements: 80%+

### Key Features Tested

✅ Multi-tenant data isolation
✅ Authentication & authorization
✅ SQL injection prevention
✅ XSS prevention
✅ Rate limiting
✅ Input validation
✅ Error handling
✅ Database transactions
✅ ML model accuracy
✅ Database schema integrity

For detailed documentation, see `/home/user/Fleet/docs/TESTING.md`
