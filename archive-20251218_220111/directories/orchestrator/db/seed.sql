-- ============================================================================
-- Seed Data for Fleet Frontend Refactoring Project
-- Initializes project, agents, and task hierarchy
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Project
-- ============================================================================
INSERT INTO projects (id, name, repo, default_branch, github_url, azure_url, status, percent_complete)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Fleet Frontend Architectural Refactoring',
  'asmortongpt/Fleet',
  'main',
  'https://github.com/asmortongpt/Fleet',
  'https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet',
  'active',
  0
);

-- ============================================================================
-- STEP 2: Create Specialized Agents
-- ============================================================================
INSERT INTO agents (id, name, llm_model, role, capabilities, max_concurrent_tasks, active) VALUES
  ('aaaaaaaa-1111-1111-1111-111111111111', 'architect-prime', 'claude-sonnet-4-5', 'planner', '["architecture", "task-decomposition", "dependency-mapping"]', 1, true),
  ('aaaaaaaa-2222-2222-2222-222222222222', 'typescript-specialist', 'claude-sonnet-4-5', 'coder', '["typescript", "strict-mode", "type-safety"]', 3, true),
  ('aaaaaaaa-3333-3333-3333-333333333333', 'eslint-specialist', 'gpt-4.5-preview', 'coder', '["eslint", "code-quality", "static-analysis"]', 2, true),
  ('aaaaaaaa-4444-4444-4444-444444444444', 'component-architect', 'claude-sonnet-4-5', 'coder', '["react", "component-design", "reusability"]', 3, true),
  ('aaaaaaaa-5555-5555-5555-555555555555', 'hooks-specialist', 'claude-sonnet-4-5', 'coder', '["react-hooks", "state-management", "custom-hooks"]', 3, true),
  ('aaaaaaaa-6666-6666-6666-666666666666', 'refactoring-expert', 'claude-sonnet-4-5', 'coder', '["refactoring", "srp", "modularity"]', 5, true),
  ('aaaaaaaa-7777-7777-7777-777777777777', 'test-engineer', 'gpt-4.5-preview', 'tester', '["vitest", "playwright", "test-coverage"]', 3, true),
  ('aaaaaaaa-8888-8888-8888-888888888888', 'code-reviewer', 'claude-sonnet-4-5', 'reviewer', '["code-review", "best-practices", "quality-gates"]', 5, true),
  ('aaaaaaaa-9999-9999-9999-999999999999', 'pr-manager', 'gpt-4.5-preview', 'devops', '["github", "pr-automation", "ci-cd"]', 10, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'zod-specialist', 'claude-sonnet-4-5', 'coder', '["zod", "validation", "schemas"]', 3, true);

-- ============================================================================
-- STEP 3: Create Root-Level Tasks (Phases)
-- ============================================================================

-- PHASE 1: TypeScript & ESLint Configuration
INSERT INTO tasks (id, project_id, parent_id, title, description, status, percent_complete, priority, estimated_hours, dod, verification_plan)
VALUES (
  'task-phase1-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Phase 1: Enable TypeScript Strict Mode & ESLint',
  'Enable all TypeScript strict mode options and configure comprehensive ESLint rules for code quality and security. This is foundational work that must complete before other refactoring.',
  'pending',
  0,
  1000, -- Highest priority
  24,
  'tsconfig.json has strict: true and all strict options enabled. ESLint configured with @typescript-eslint, security, and unused-imports plugins. All existing code passes linting and type-checking without errors.',
  'Run npm run lint and tsc --noEmit with zero errors. Review tsconfig.json and .eslintrc.json for completeness.'
);

-- PHASE 2: Shared Components
INSERT INTO tasks (id, project_id, parent_id, title, description, status, percent_complete, priority, estimated_hours, dod, verification_plan)
VALUES (
  'task-phase2-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Phase 2: Create Shared Components',
  'Build reusable shared components (DataTable, DialogForm, FilterPanel, PageHeader) to eliminate 20-25% code duplication across 50+ modules. These components must be generic, fully typed, and tested.',
  'pending',
  0,
  900,
  40,
  'Four shared components created in src/shared/components/ with full TypeScript types, Storybook stories, unit tests (80%+ coverage), and integration tests. At least 3 existing modules refactored to use new shared components.',
  'Run npm test -- --coverage and verify src/shared/components has 80%+ coverage. Manual review of DataTable, DialogForm, FilterPanel, PageHeader components.'
);

-- PHASE 3: Shared Hooks
INSERT INTO tasks (id, project_id, parent_id, title, description, status, percent_complete, priority, estimated_hours, dod, verification_plan)
VALUES (
  'task-phase3-0000-0000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Phase 3: Create Shared Hooks',
  'Develop generic, reusable hooks (useFilters, useExport, useMetrics) to centralize duplicated logic across modules. Eliminates copy-paste filter logic, export logic, and metrics calculations.',
  'pending',
  0,
  850,
  32,
  'Three shared hooks in src/shared/hooks/ with full TypeScript types, unit tests (80%+ coverage), and documentation. At least 5 modules refactored to use shared hooks instead of duplicated logic.',
  'Run npm test -- src/shared/hooks and verify 80%+ coverage. Code review to confirm hook reusability and type safety.'
);

-- PHASE 4: DataWorkbench Refactoring
INSERT INTO tasks (id, project_id, parent_id, title, description, status, percent_complete, priority, dependencies, estimated_hours, dod, verification_plan)
VALUES (
  'task-phase4-0000-0000-000000000004',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Phase 4: Refactor DataWorkbench Monolith',
  'Break down 2000+ line DataWorkbench.tsx into feature modules using new feature-based folder structure. Apply shared components and hooks to eliminate duplication.',
  'pending',
  0,
  800,
  '["task-phase1-0000-0000-000000000001", "task-phase2-0000-0000-000000000002", "task-phase3-0000-0000-000000000003"]'::jsonb,
  50,
  'DataWorkbench.tsx split into src/features/data-workbench/ with separate components for metrics, filters, tables, dialogs. Each component <300 lines. Uses shared components and hooks. All functionality preserved with tests.',
  'Run E2E tests for DataWorkbench module. Manual QA of all features. Code review for SRP compliance and component size.'
);

-- PHASE 5: AssetManagement Refactoring
INSERT INTO tasks (id, project_id, parent_id, title, description, status, percent_complete, priority, dependencies, estimated_hours, dod, verification_plan)
VALUES (
  'task-phase5-0000-0000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Phase 5: Refactor AssetManagement Monolith',
  'Break down 2000+ line AssetManagement.tsx into feature modules. Apply shared components and hooks. Fix field name mismatches (warranty_expiration vs warranty_expiry).',
  'pending',
  0,
  750,
  '["task-phase1-0000-0000-000000000001", "task-phase2-0000-0000-000000000002", "task-phase3-0000-0000-000000000003"]'::jsonb,
  50,
  'AssetManagement.tsx split into src/features/assets/ with separate components. Field name mismatches resolved. Uses shared components and hooks. All functionality preserved with tests.',
  'Run E2E tests for AssetManagement module. Verify API field mappings match DB schema. Code review for SRP compliance.'
);

-- PHASE 6: IncidentManagement Refactoring
INSERT INTO tasks (id, project_id, parent_id, title, description, status, percent_complete, priority, dependencies, estimated_hours, dod, verification_plan)
VALUES (
  'task-phase6-0000-0000-000000000006',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Phase 6: Refactor IncidentManagement Monolith',
  'Break down 2000+ line IncidentManagement.tsx into feature modules. Apply shared components and hooks.',
  'pending',
  0,
  700,
  '["task-phase1-0000-0000-000000000001", "task-phase2-0000-0000-000000000002", "task-phase3-0000-0000-000000000003"]'::jsonb,
  50,
  'IncidentManagement.tsx split into src/features/incidents/ with separate components. Uses shared components and hooks. All functionality preserved with tests.',
  'Run E2E tests for IncidentManagement module. Manual QA of all features. Code review for SRP compliance.'
);

-- PHASE 7: Zod Schema Implementation
INSERT INTO tasks (id, project_id, parent_id, title, description, status, percent_complete, priority, dependencies, estimated_hours, dod, verification_plan)
VALUES (
  'task-phase7-0000-0000-000000000007',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Phase 7: Implement Zod Schemas',
  'Define Zod schemas for all major entity types (Vehicle, Asset, Incident, Driver, etc.) to enforce type safety and validate API responses. Eliminates field mismatch errors.',
  'pending',
  0,
  650,
  '["task-phase1-0000-0000-000000000001"]'::jsonb,
  40,
  'Zod schemas defined in src/shared/schemas/ for all major entities. API hooks use .parse() to validate responses. TypeScript types auto-generated from Zod schemas. Zero runtime field mismatch errors.',
  'Run integration tests against live API with Zod validation enabled. Review schema coverage for all API endpoints.'
);

-- PHASE 8: Folder Structure Reorganization
INSERT INTO tasks (id, project_id, parent_id, title, description, status, percent_complete, priority, dependencies, estimated_hours, dod, verification_plan)
VALUES (
  'task-phase8-0000-0000-000000000008',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Phase 8: Reorganize to Feature-Based Structure',
  'Migrate from flat src/components/modules/ (50+ files) to feature-based src/features/ structure with logical grouping. Preserve lazy loading and code splitting.',
  'pending',
  0,
  600,
  '["task-phase4-0000-0000-000000000004", "task-phase5-0000-0000-000000000005", "task-phase6-0000-0000-000000000006"]'::jsonb,
  24,
  'All modules moved to src/features/ with feature-based folders (fleet/, maintenance/, assets/, incidents/). Lazy loading still works. Build output shows proper code splitting. No broken imports.',
  'Run npm run build and verify bundle sizes. Check that each feature has own chunk. Run all E2E tests to verify no broken imports.'
);

-- PHASE 9: Test Coverage Expansion
INSERT INTO tasks (id, project_id, parent_id, title, description, status, percent_complete, priority, dependencies, estimated_hours, dod, verification_plan)
VALUES (
  'task-phase9-0000-0000-000000000009',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Phase 9: Expand Test Coverage to 80%+',
  'Add comprehensive unit, integration, and E2E tests for all refactored code. Target 80%+ coverage across shared components, hooks, and feature modules.',
  'pending',
  0,
  500,
  '["task-phase2-0000-0000-000000000002", "task-phase3-0000-0000-000000000003", "task-phase4-0000-0000-000000000004", "task-phase5-0000-0000-000000000005", "task-phase6-0000-0000-000000000006"]'::jsonb,
  60,
  'Test coverage at 80%+ for src/shared/ and src/features/. All shared components and hooks have unit tests. Critical user paths have E2E tests. Coverage report shows no major gaps.',
  'Run npm run test:coverage and verify 80%+ coverage. Review coverage report for gaps. Run npm run test:e2e for regression testing.'
);

-- ============================================================================
-- STEP 4: Create Subtasks for Phase 1 (TypeScript & ESLint)
-- ============================================================================
INSERT INTO tasks (project_id, parent_id, title, description, status, priority, estimated_hours, dod)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'task-phase1-0000-0000-000000000001', 'Enable TypeScript Strict Mode', 'Update tsconfig.json to enable strict: true and all strict options (noImplicitAny, strictNullChecks, strictFunctionTypes, etc.)', 'pending', 1000, 8, 'tsconfig.json has strict: true enabled. Code compiles with tsc --noEmit with zero errors.'),
  ('11111111-1111-1111-1111-111111111111', 'task-phase1-0000-0000-000000000001', 'Configure ESLint Rules', 'Install and configure @typescript-eslint/eslint-plugin, eslint-plugin-security, eslint-plugin-unused-imports. Update .eslintrc.json with comprehensive rules.', 'pending', 950, 6, 'ESLint configured with TypeScript, security, and unused-imports plugins. npm run lint passes with zero errors.'),
  ('11111111-1111-1111-1111-111111111111', 'task-phase1-0000-0000-000000000001', 'Fix Type Errors from Strict Mode', 'Resolve all type errors surfaced by enabling strict mode. Add explicit types, null checks, and remove any usage.', 'pending', 900, 8, 'Zero TypeScript errors when running tsc --noEmit. All implicit any types resolved.'),
  ('11111111-1111-1111-1111-111111111111', 'task-phase1-0000-0000-000000000001', 'Fix Linting Errors', 'Resolve all ESLint errors and warnings from new rules. Remove unused imports, fix security issues, enforce best practices.', 'pending', 850, 2, 'npm run lint passes with zero errors and warnings.');

-- ============================================================================
-- STEP 5: Create Subtasks for Phase 2 (Shared Components)
-- ============================================================================
INSERT INTO tasks (project_id, parent_id, title, description, status, priority, estimated_hours, dod)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'task-phase2-0000-0000-000000000002', 'Create DataTable Shared Component', 'Build generic, reusable DataTable component with sorting, filtering, pagination, and selection. Replace 20+ custom table implementations.', 'pending', 900, 12, 'DataTable component in src/shared/components/DataTable/ with full TypeScript types, unit tests (80%+ coverage), Storybook story. Used in at least 3 modules.'),
  ('11111111-1111-1111-1111-111111111111', 'task-phase2-0000-0000-000000000002', 'Create DialogForm Shared Component', 'Build generic, reusable DialogForm component for add/edit dialogs. Replace 30+ similar dialog patterns.', 'pending', 850, 10, 'DialogForm component in src/shared/components/DialogForm/ with full TypeScript types, unit tests (80%+ coverage), Storybook story. Used in at least 3 modules.'),
  ('11111111-1111-1111-1111-111111111111', 'task-phase2-0000-0000-000000000002', 'Create FilterPanel Shared Component', 'Build generic, reusable FilterPanel component for data filtering UI. Handles common filter patterns (text search, date range, multi-select).', 'pending', 800, 8, 'FilterPanel component in src/shared/components/FilterPanel/ with full TypeScript types, unit tests (80%+ coverage), Storybook story. Used in at least 3 modules.'),
  ('11111111-1111-1111-1111-111111111111', 'task-phase2-0000-0000-000000000002', 'Create PageHeader Shared Component', 'Build generic, reusable PageHeader component with breadcrumbs, actions, and page title. Replace duplicate header patterns.', 'pending', 750, 6, 'PageHeader component in src/shared/components/PageHeader/ with full TypeScript types, unit tests (80%+ coverage), Storybook story. Used in at least 3 modules.'),
  ('11111111-1111-1111-1111-111111111111', 'task-phase2-0000-0000-000000000002', 'Refactor 3 Modules to Use Shared Components', 'Migrate FleetDashboard, AssetManagement, and DataWorkbench to use new shared components as proof-of-concept.', 'pending', 700, 4, 'Three modules successfully use shared components. E2E tests pass. Code duplication reduced by 20%+.');

-- ============================================================================
-- STEP 6: Create Subtasks for Phase 3 (Shared Hooks)
-- ============================================================================
INSERT INTO tasks (project_id, parent_id, title, description, status, priority, estimated_hours, dod)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'task-phase3-0000-0000-000000000003', 'Create useFilters Shared Hook', 'Build generic useFilters hook to handle search, sort, filter logic. Replace duplicated filter logic across modules.', 'pending', 850, 10, 'useFilters hook in src/shared/hooks/ with full TypeScript types, unit tests (80%+ coverage), documentation. Used in at least 5 modules.'),
  ('11111111-1111-1111-1111-111111111111', 'task-phase3-0000-0000-000000000003', 'Create useExport Shared Hook', 'Build generic useExport hook for exporting data (JSON, CSV, Excel). Replace duplicated export logic.', 'pending', 800, 8, 'useExport hook in src/shared/hooks/ with full TypeScript types, unit tests (80%+ coverage), documentation. Used in at least 5 modules.'),
  ('11111111-1111-1111-1111-111111111111', 'task-phase3-0000-0000-000000000003', 'Create useMetrics Shared Hook', 'Build generic useMetrics hook for calculating common metrics (counts, percentages, aggregations). Replace duplicated metrics logic.', 'pending', 750, 8, 'useMetrics hook in src/shared/hooks/ with full TypeScript types, unit tests (80%+ coverage), documentation. Used in at least 5 modules.'),
  ('11111111-1111-1111-1111-111111111111', 'task-phase3-0000-0000-000000000003', 'Refactor 5 Modules to Use Shared Hooks', 'Migrate FleetDashboard, AssetManagement, DataWorkbench, IncidentManagement, MaintenanceScheduling to use shared hooks.', 'pending', 700, 6, 'Five modules successfully use shared hooks. E2E tests pass. Code duplication reduced by 15%+.');

-- ============================================================================
-- STEP 7: Update Project Percent Complete
-- ============================================================================
UPDATE projects
SET percent_complete = calculate_project_percent_complete('11111111-1111-1111-1111-111111111111')
WHERE id = '11111111-1111-1111-1111-111111111111';
