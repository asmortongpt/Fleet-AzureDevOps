# Database Reset Harness

Fast, reliable database reset system for E2E testing with snapshot/restore capability.

## Features

- **⚡ Fast Resets**: < 10 second database reset using pg_dump/restore snapshots
- **🔒 Safety First**: Built-in safeguards prevent production database operations
- **🧪 Test Isolation**: Parallel test execution with isolated database instances
- **📸 Snapshots**: Create and restore database snapshots for consistent test state
- **🎯 Performance**: Optimized for speed with parallel restore and COPY bulk inserts
- **📊 Monitoring**: Built-in performance benchmarks and statistics

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Reset Harness Components                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐  ┌──────────────────┐              │
│  │ SnapshotManager    │  │  ResetHarness    │              │
│  │                    │  │                  │              │
│  │ • createSnapshot   │  │ • resetDatabase  │              │
│  │ • restoreSnapshot  │  │ • resetWithSnap  │              │
│  │ • verifySnapshot   │  │ • seedFresh      │              │
│  │ • listSnapshots    │  │                  │              │
│  └────────────────────┘  └──────────────────┘              │
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │      TestIsolationManager                  │            │
│  │                                             │            │
│  │  • acquireTestDatabase                     │            │
│  │  • releaseTestDatabase                     │            │
│  │  • cleanupTestDatabases                    │            │
│  │  • Database pooling & reuse                │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │              CLI Tool                       │            │
│  │                                             │            │
│  │  • db:reset        • db:snapshot            │            │
│  │  • db:reset:fast   • db:cleanup             │            │
│  │  • db:benchmark    • db:stats               │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Initial Setup

1. **Install dependencies** (if not already installed):
```bash
cd api
npm install commander chalk ora
```

2. **Create baseline snapshot**:
```bash
npm run test:e2e:setup
```

This will:
- Drop all tables
- Run migrations
- Seed test data
- Create `e2e-baseline` snapshot

### Using in Tests

#### Playwright Global Setup

The harness is automatically configured in `tests/global-setup.ts`:

```typescript
import { getResetHarness } from '../api/src/db/reset/reset-harness';

async function globalSetup() {
  const harness = getResetHarness();
  await harness.resetWithSnapshot('e2e-baseline');
  await harness.close();
}
```

#### Individual Test Isolation

For parallel test execution with isolated databases:

```typescript
import { setupTestDatabase, teardownTestDatabase } from './api/src/db/reset/test-isolation';

test.beforeEach(async () => {
  const dbUrl = await setupTestDatabase({ file: __filename });
  process.env.DATABASE_URL = dbUrl;
});

test.afterEach(async () => {
  await teardownTestDatabase();
});
```

## CLI Commands

### Full Database Reset

```bash
# Full reset with seed (creates e2e-baseline snapshot)
npm run db:reset

# Full reset without seed
npm run db:reset -- --no-seed

# Dry run (show what would be done)
npm run db:reset -- --dry-run
```

### Fast Reset (from Snapshot)

```bash
# Restore from e2e-baseline snapshot (< 10s)
npm run db:reset:fast

# Restore from custom snapshot with 8 parallel jobs
npm run db:reset:fast -- --snapshot my-snapshot --parallel 8
```

### Snapshot Management

```bash
# Create a named snapshot
npm run db:snapshot my-snapshot

# List all snapshots
npm run db:snapshots

# Restore from specific snapshot
npm run db:restore my-snapshot

# Delete a snapshot
npm run db:reset:cli delete my-snapshot
```

### Test Database Management

```bash
# Show test database statistics
npm run db:stats

# Cleanup all test databases
npm run db:cleanup

# Force cleanup (even if active)
npm run db:cleanup -- --force
```

### Performance Benchmarking

```bash
# Run 5 iterations and measure performance
npm run db:benchmark

# Custom iterations
npm run db:benchmark -- --iterations 10
```

## Performance Targets

| Operation | Target | Typical |
|-----------|--------|---------|
| Full Reset + Seed | < 30s | 15-25s |
| Snapshot Creation | < 20s | 10-15s |
| Snapshot Restore | **< 10s** | **5-8s** |
| Test DB Acquire | < 5s | 2-3s |

## Configuration

### Environment Variables

```bash
# Database connection
DATABASE_URL=postgresql://user:pass@localhost:5432/fleet_test

# Snapshot directory (default: api/src/db/reset/snapshots)
SNAPSHOT_DIR=/path/to/snapshots

# Migration directory (default: api/src/migrations)
MIGRATION_DIR=/path/to/migrations

# Force full reset instead of using snapshot
FORCE_RESET=true
```

### Database Pool Settings

```bash
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=2000
```

## Safety Features

### Production Protection

The harness includes multiple safeguards:

1. **Database Name Validation**: Rejects databases with 'prod' or 'production' in name
2. **Environment Check**: Refuses to run if `NODE_ENV=production`
3. **Confirmation Prompts**: Requires 3-second confirmation for destructive operations
4. **Automatic Backups**: Creates snapshot before full reset

### Safety Override

To bypass safety checks (USE WITH EXTREME CAUTION):

```bash
# This should NEVER be used in production
OVERRIDE_SAFETY=true npm run db:reset
```

## Advanced Usage

### Custom Snapshot Options

```typescript
import { getSnapshotManager } from './snapshot-manager';

const manager = getSnapshotManager();

// Data-only snapshot (no schema)
await manager.createSnapshot('data-only', {
  dataOnly: true,
  compress: true,
});

// Schema-only snapshot
await manager.createSnapshot('schema-only', {
  schemaOnly: true,
  format: 'plain', // SQL format instead of custom
});

// Exclude specific tables
await manager.createSnapshot('partial', {
  excludeTables: ['audit_logs', 'session_data'],
});
```

### Parallel Test Execution

```typescript
import { getIsolationManager } from './test-isolation';

const manager = getIsolationManager(process.env.DATABASE_URL, {
  maxDatabases: 10,        // Allow up to 10 parallel tests
  prefix: 'test_',         // Database name prefix
  baseSnapshot: 'e2e-baseline',
  idleTimeout: 300000,     // 5 minutes
});

// Each test gets its own database
const testDb = await manager.acquireTestDatabase('my-test.spec.ts');
// ... run test ...
await manager.releaseTestDatabase(testDb.id);
```

### Custom Reset Logic

```typescript
import { DatabaseResetHarness } from './reset-harness';

class CustomResetHarness extends DatabaseResetHarness {
  async seedDatabase(): Promise<number> {
    // Custom seeding logic
    await this.pool.query('INSERT INTO users ...');
    return super.seedDatabase();
  }
}
```

## Troubleshooting

### Snapshot Restore Fails

```bash
# Verify snapshot integrity
npm run db:reset:cli verify e2e-baseline

# If corrupted, recreate
npm run test:e2e:setup
```

### Reset Takes Too Long

```bash
# Check performance with benchmark
npm run db:benchmark

# Try increasing parallel jobs
npm run db:reset:fast -- --parallel 8

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

### Test Database Leaks

```bash
# Show active test databases
npm run db:stats

# Force cleanup all
npm run db:cleanup -- --force
```

### Connection Pool Exhausted

```bash
# Increase pool size
export DB_POOL_MAX=20

# Or terminate idle connections
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"
```

## Best Practices

### 1. Use Snapshots for Speed

```typescript
// ❌ Slow: Full reset every time
beforeEach(async () => {
  await harness.resetDatabase();
});

// ✅ Fast: Restore from snapshot
beforeEach(async () => {
  await harness.resetWithSnapshot('e2e-baseline');
});
```

### 2. Create Snapshots at Different States

```typescript
// Baseline: Empty database with schema
await harness.seedFreshDatabase('baseline-empty');

// With minimal data
await seedMinimalData();
await snapshotMgr.createSnapshot('baseline-minimal');

// With full dataset
await seedFullData();
await snapshotMgr.createSnapshot('baseline-full');
```

### 3. Isolate Long-Running Tests

```typescript
// For tests that need clean database
test('long operation', async () => {
  const testDb = await manager.acquireTestDatabase();
  // Test has its own isolated database
  await manager.releaseTestDatabase(testDb.id);
});
```

### 4. Monitor Performance

```typescript
test('should be fast', async () => {
  const start = Date.now();
  await harness.resetWithSnapshot('e2e-baseline');
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(10000); // 10 seconds
});
```

## Architecture Decisions

### Why pg_dump/restore instead of SQL TRUNCATE?

- **pg_dump custom format** supports parallel restore (4-8x faster)
- **Snapshot consistency**: Exact database state reproduction
- **Compression**: Snapshots are 5-10x smaller than raw SQL
- **Rollback safety**: Original database unaffected during restore

### Why Test Isolation?

- **Parallel execution**: Run 10+ tests simultaneously
- **No interference**: Tests don't affect each other
- **Faster CI**: Reduce total test time by 3-5x
- **Database pooling**: Reuse databases instead of recreating

### Why Custom Format over Plain SQL?

| Format | Size | Restore Time | Parallel |
|--------|------|--------------|----------|
| Plain SQL | 100 MB | 45s | No |
| Tar | 80 MB | 35s | Limited |
| Custom | 15 MB | **8s** | **Yes (4 jobs)** |

## Contributing

When adding new features:

1. **Add tests** to `__tests__/reset-harness.test.ts`
2. **Update benchmarks** if performance characteristics change
3. **Document** new CLI commands in this README
4. **Test safety features** - never compromise production protection

## License

MIT - Fleet Management System
