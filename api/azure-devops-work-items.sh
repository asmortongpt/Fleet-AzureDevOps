#!/bin/bash

# Azure DevOps Work Item Creation Script
# This script creates all 51 remediation work items in Azure DevOps
# with agent assignments and detailed acceptance criteria

set -e

# Configuration
ORG="https://dev.azure.com/CapitalTechAlliance"
PROJECT="FleetManagement"
AREA="FleetManagement\\Remediation"
ITERATION="FleetManagement\\Sprint 1"

# Set Azure DevOps defaults
export AZURE_DEVOPS_EXT_PAT="${AZURE_DEVOPS_PAT}"
az devops configure --defaults organization="$ORG" project="$PROJECT"

echo "============================================"
echo "Creating Azure DevOps Remediation Work Items"
echo "============================================"

# Epic 1: Backend Architecture & Configuration
echo ""
echo "Creating Epic 1: Backend Architecture & Configuration..."
EPIC1=$(az boards work-item create \
  --title "Epic 1: Backend Architecture & Configuration" \
  --type "Epic" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields "System.Description=Enhance backend architecture with TypeScript strict mode, dependency injection, and robust error handling" \
  --query id -o tsv)

echo "✓ Created Epic 1 (ID: $EPIC1)"

# Work Item 1.1: TypeScript Strict Mode
echo "Creating Work Item 1.1: TypeScript Strict Mode..."
az boards work-item create \
  --title "WI 1.1: Enable TypeScript Strict Mode" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Config-Agent-01" \
    "System.Description=Enable strict TypeScript compilation and fix all resulting type errors" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=5" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Set strict: true in tsconfig.json\n- Set noEmitOnError: true\n- Fix all ~150 TypeScript errors\n- Add ESLint rule for no-explicit-any" \
    "System.Tags=Critical,TypeScript,Architecture" \
    "System.Parent=$EPIC1"

# Work Item 1.2: Dependency Injection Container
echo "Creating Work Item 1.2: Dependency Injection Container..."
az boards work-item create \
  --title "WI 1.2: Implement Dependency Injection Container" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Config-Agent-02" \
    "System.Description=Set up Awilix or tsyringe for dependency injection and service lifetime management" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=8" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Install and configure Awilix\n- Create src/container.ts with service registrations\n- Refactor 5 major services to use DI\n- Update server.ts to initialize container" \
    "System.Tags=High,DI,Architecture" \
    "System.Parent=$EPIC1"

# Work Item 1.3: Centralized Error Handling (COMPLETED)
echo "Creating Work Item 1.3: Centralized Error Handling (COMPLETED)..."
az boards work-item create \
  --title "WI 1.3: Centralized Error Handling" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Config-Agent-03" \
    "System.Description=✅ COMPLETED - Implement centralized error handling with custom error classes" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=3" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=✅ Created src/utils/errors.ts\n✅ Created src/middleware/async-handler.ts\n✅ Integrated with existing error-handler.ts" \
    "System.Tags=Critical,Completed,ErrorHandling" \
    "System.State=Done" \
    "System.Parent=$EPIC1"

# Work Item 1.4: Configuration Validation
echo "Creating Work Item 1.4: Configuration Validation..."
az boards work-item create \
  --title "WI 1.4: Environment Variable Validation" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Config-Agent-04" \
    "System.Description=Validate all required environment variables on startup with clear error messages" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=3" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Create src/config/validation.ts\n- Define required vs optional variables\n- Fail fast on startup if critical vars missing\n- Provide helpful error messages" \
    "System.Tags=High,Configuration,Reliability" \
    "System.Parent=$EPIC1"

# Work Item 1.5: Graceful Shutdown
echo "Creating Work Item 1.5: Graceful Shutdown Handlers..."
az boards work-item create \
  --title "WI 1.5: Implement Graceful Shutdown" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Config-Agent-05" \
    "System.Description=Handle SIGTERM/SIGINT for graceful shutdown of database connections and HTTP server" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=2" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Add process signal handlers in server.ts\n- Close DB connections gracefully\n- Drain HTTP connections\n- Set 30-second shutdown timeout" \
    "System.Tags=High,Reliability,Kubernetes" \
    "System.Parent=$EPIC1"

# Epic 2: Backend API & Data Fetching
echo ""
echo "Creating Epic 2: Backend API & Data Fetching..."
EPIC2=$(az boards work-item create \
  --title "Epic 2: Backend API & Data Fetching" \
  --type "Epic" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields "System.Description=Implement repository pattern, optimize queries, and standardize API responses" \
  --query id -o tsv)

echo "✓ Created Epic 2 (ID: $EPIC2)"

# Work Item 2.1: ORM Evaluation
echo "Creating Work Item 2.1: ORM vs Raw SQL Evaluation..."
az boards work-item create \
  --title "WI 2.1: Evaluate ORM vs Raw SQL" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Data-Agent-01" \
    "System.Description=Assess Prisma, Drizzle, or continue with raw SQL + query builders" \
    "Microsoft.VSTS.Common.Priority=3" \
    "Microsoft.VSTS.Scheduling.Effort=5" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Benchmark query performance (ORM vs raw SQL)\n- Evaluate type safety benefits\n- Consider migration complexity\n- Document recommendation with pros/cons" \
    "System.Tags=Medium,Research,DataAccess" \
    "System.Parent=$EPIC2"

# Work Item 2.2: Repository Pattern (COMPLETED)
echo "Creating Work Item 2.2: Repository Pattern (COMPLETED)..."
az boards work-item create \
  --title "WI 2.2: Repository Pattern Implementation" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Data-Agent-02" \
    "System.Description=✅ COMPLETED - Implement base repository with CRUD operations" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=8" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=✅ Created BaseRepository<T>\n✅ Created VehicleRepository example\n✅ Includes pagination, transactions, RLS" \
    "System.Tags=Critical,Completed,DataAccess" \
    "System.State=Done" \
    "System.Parent=$EPIC2"

# Work Item 2.3: API Response Standardization (COMPLETED)
echo "Creating Work Item 2.3: API Response Standardization (COMPLETED)..."
az boards work-item create \
  --title "WI 2.3: Standardize API Responses" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-API-Agent-01" \
    "System.Description=✅ COMPLETED - Create consistent response format for all endpoints" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=3" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=✅ Created src/utils/api-response.ts\n✅ Standardized success/error formats\n✅ Added pagination helpers" \
    "System.Tags=High,Completed,API" \
    "System.State=Done" \
    "System.Parent=$EPIC2"

# Work Item 2.4: Query Performance Optimization
echo "Creating Work Item 2.4: Query Performance Optimization..."
az boards work-item create \
  --title "WI 2.4: Optimize Database Queries" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Data-Agent-03" \
    "System.Description=Add database indexes and optimize N+1 query patterns" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=5" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Run EXPLAIN ANALYZE on slow queries\n- Create migration for missing indexes\n- Eliminate N+1 queries in top 5 endpoints\n- Document query optimization guidelines" \
    "System.Tags=High,Performance,Database" \
    "System.Parent=$EPIC2"

# Work Item 2.5: Service Layer Extraction
echo "Creating Work Item 2.5: Extract Service Layer..."
az boards work-item create \
  --title "WI 2.5: Extract Business Logic to Service Layer" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Arch-Agent-01" \
    "System.Description=Move business logic from routes to dedicated service classes" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=13" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Create src/services/VehicleService.ts\n- Create src/services/MaintenanceService.ts\n- Refactor 10 major routes to use services\n- Routes should only handle HTTP concerns" \
    "System.Tags=High,Architecture,Refactoring" \
    "System.Parent=$EPIC2"

# Epic 3: Backend Security & Authentication
echo ""
echo "Creating Epic 3: Backend Security & Authentication..."
EPIC3=$(az boards work-item create \
  --title "Epic 3: Backend Security & Authentication" \
  --type "Epic" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields "System.Description=Enhance security with proper rate limiting, logging, JWT hardening, and CSRF protection" \
  --query id -o tsv)

echo "✓ Created Epic 3 (ID: $EPIC3)"

# Work Item 3.1: Rate Limiting Enhancement
echo "Creating Work Item 3.1: Advanced Rate Limiting..."
az boards work-item create \
  --title "WI 3.1: Implement Redis-Backed Rate Limiting" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Security-Agent-01" \
    "System.Description=Replace in-memory rate limiting with distributed Redis-backed implementation" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=5" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Install rate-limiter-flexible package\n- Configure Redis store\n- Set per-endpoint limits (auth: 5/min, API: 100/min)\n- Add rate limit headers (X-RateLimit-*)" \
    "System.Tags=Critical,Security,RateLimiting" \
    "System.Parent=$EPIC3"

# Work Item 3.2: JWT Security Hardening
echo "Creating Work Item 3.2: JWT Security Hardening..."
az boards work-item create \
  --title "WI 3.2: Harden JWT Implementation" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Security-Agent-02" \
    "System.Description=Implement refresh token rotation and token revocation list" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=8" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Implement refresh token rotation\n- Create token revocation list (Redis)\n- Store tokens in HttpOnly cookies\n- Add token fingerprinting\n- Implement logout across all sessions" \
    "System.Tags=Critical,Security,Authentication" \
    "System.Parent=$EPIC3"

# Work Item 3.3: Security Logging
echo "Creating Work Item 3.3: Enhanced Security Logging..."
az boards work-item create \
  --title "WI 3.3: Implement Security Event Logging" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Security-Agent-03" \
    "System.Description=Log all authentication events, authorization failures, and suspicious activities" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=3" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Log failed login attempts\n- Log authorization failures\n- Log rate limit violations\n- Log suspicious patterns (credential stuffing, etc.)\n- Create security dashboard queries" \
    "System.Tags=High,Security,Logging" \
    "System.Parent=$EPIC3"

# Work Item 3.4: CSRF Protection Enhancement
echo "Creating Work Item 3.4: CSRF Protection Enhancement..."
az boards work-item create \
  --title "WI 3.4: Enhance CSRF Protection" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Security-Agent-04" \
    "System.Description=Verify CSRF implementation and add per-session tokens" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=3" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Verify double-submit cookie implementation\n- Add per-session CSRF tokens\n- Exclude GET/HEAD/OPTIONS from CSRF checks\n- Document CSRF token usage for frontend" \
    "System.Tags=High,Security,CSRF" \
    "System.Parent=$EPIC3"

# Work Item 3.5: Input Validation Audit
echo "Creating Work Item 3.5: Input Validation Comprehensive Audit..."
az boards work-item create \
  --title "WI 3.5: Comprehensive Input Validation Audit" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Backend-Security-Agent-05" \
    "System.Description=Audit all endpoints for proper input validation using Zod schemas" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=8" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Audit all 50+ API endpoints\n- Create Zod schemas for missing validations\n- Add sanitization for HTML/SQL injection\n- Document validation patterns" \
    "System.Tags=Critical,Security,Validation" \
    "System.Parent=$EPIC3"

# Epic 4: Frontend Architecture & Configuration
echo ""
echo "Creating Epic 4: Frontend Architecture & Configuration..."
EPIC4=$(az boards work-item create \
  --title "Epic 4: Frontend Architecture & Configuration" \
  --type "Epic" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields "System.Description=Break down large components, eliminate code duplication, and organize folder structure" \
  --query id -o tsv)

echo "✓ Created Epic 4 (ID: $EPIC4)"

# Work Item 4.1: Component Breakdown - ProjectDashboard
echo "Creating Work Item 4.1: Break Down ProjectDashboard..."
az boards work-item create \
  --title "WI 4.1: Break Down ProjectDashboard Component" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Frontend-Arch-Agent-01" \
    "System.Description=Split 800+ line ProjectDashboard into smaller, focused components" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=8" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Extract ProjectHeader component\n- Extract ProjectMetrics component\n- Extract ProjectTimeline component\n- Extract ProjectTeam component\n- Main file <300 lines" \
    "System.Tags=Critical,Frontend,Refactoring" \
    "System.Parent=$EPIC4"

# Work Item 4.2: Component Breakdown - RiskManagement
echo "Creating Work Item 4.2: Break Down RiskManagement..."
az boards work-item create \
  --title "WI 4.2: Break Down RiskManagement Component" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Frontend-Arch-Agent-02" \
    "System.Description=Split 600+ line RiskManagement into smaller components" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=5" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Extract RiskMatrix component\n- Extract RiskList component\n- Extract RiskForm component\n- Main file <300 lines" \
    "System.Tags=Critical,Frontend,Refactoring" \
    "System.Parent=$EPIC4"

# Work Item 4.3: Component Breakdown - IntakeForm
echo "Creating Work Item 4.3: Break Down IntakeForm..."
az boards work-item create \
  --title "WI 4.3: Break Down IntakeForm Component" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Frontend-Arch-Agent-03" \
    "System.Description=Split 500+ line IntakeForm into step components" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=5" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Extract BasicInfoStep component\n- Extract RequirementsStep component\n- Extract BudgetStep component\n- Extract ReviewStep component\n- Main file <200 lines" \
    "System.Tags=High,Frontend,Refactoring" \
    "System.Parent=$EPIC4"

# Work Item 4.4: Folder Structure Reorganization
echo "Creating Work Item 4.4: Reorganize Folder Structure..."
az boards work-item create \
  --title "WI 4.4: Reorganize Frontend Folder Structure" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Frontend-Arch-Agent-04" \
    "System.Description=Organize components by feature/domain instead of flat structure" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=8" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Create feature-based folders (projects/, risks/, intake/)\n- Move shared components to src/components/shared/\n- Move UI primitives to src/components/ui/\n- Update all imports" \
    "System.Tags=High,Frontend,Organization" \
    "System.Parent=$EPIC4"

# Work Item 4.5: Code Duplication Elimination
echo "Creating Work Item 4.5: Eliminate Code Duplication..."
az boards work-item create \
  --title "WI 4.5: Extract Reusable Components" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Frontend-Arch-Agent-05" \
    "System.Description=Identify and extract duplicated UI patterns into reusable components" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=8" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Extract StatusBadge component (used 15+ times)\n- Extract DataTable component (used 10+ times)\n- Extract FilterBar component (used 8+ times)\n- Extract ConfirmDialog component (used 12+ times)" \
    "System.Tags=High,Frontend,DRY" \
    "System.Parent=$EPIC4"

# Epic 5: Frontend Data Fetching
echo ""
echo "Creating Epic 5: Frontend Data Fetching..."
EPIC5=$(az boards work-item create \
  --title "Epic 5: Frontend Data Fetching & State Management" \
  --type "Epic" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields "System.Description=Migrate to SWR, implement proper cache invalidation, and create DAL" \
  --query id -o tsv)

echo "✓ Created Epic 5 (ID: $EPIC5)"

# Work Item 5.1: SWR Migration
echo "Creating Work Item 5.1: Migrate to SWR..."
az boards work-item create \
  --title "WI 5.1: Migrate useEffect to SWR" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Frontend-Data-Agent-01" \
    "System.Description=Replace manual useEffect data fetching with SWR hooks" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=13" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Install SWR package\n- Create useSWR hooks for top 10 data fetching patterns\n- Replace useEffect in 20+ components\n- Configure global SWR options (revalidation, dedupe)" \
    "System.Tags=Critical,Frontend,DataFetching" \
    "System.Parent=$EPIC5"

# Work Item 5.2: Cache Invalidation Strategy
echo "Creating Work Item 5.2: Implement Cache Invalidation..."
az boards work-item create \
  --title "WI 5.2: Implement Cache Invalidation Strategy" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Frontend-Data-Agent-02" \
    "System.Description=Use SWR mutate for proper cache invalidation after mutations" \
    "Microsoft.VSTS.Common.Priority=1" \
    "Microsoft.VSTS.Scheduling.Effort=5" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Implement mutate after create/update/delete\n- Configure automatic revalidation\n- Add optimistic updates for better UX\n- Document cache invalidation patterns" \
    "System.Tags=Critical,Frontend,Caching" \
    "System.Parent=$EPIC5"

# Work Item 5.3: useEffect Cleanup
echo "Creating Work Item 5.3: Add useEffect Cleanup..."
az boards work-item create \
  --title "WI 5.3: Add Cleanup Functions to useEffect" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Frontend-Data-Agent-03" \
    "System.Description=Add cleanup functions to prevent memory leaks in async operations" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=3" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Audit all useEffect hooks\n- Add AbortController for fetch requests\n- Add cleanup for subscriptions/intervals\n- Use isMounted pattern where needed" \
    "System.Tags=High,Frontend,MemoryLeaks" \
    "System.Parent=$EPIC5"

# Work Item 5.4: API Client/DAL Enhancement
echo "Creating Work Item 5.4: Create Data Access Layer..."
az boards work-item create \
  --title "WI 5.4: Implement Frontend Data Access Layer" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Frontend-Data-Agent-04" \
    "System.Description=Create centralized API client with automatic token refresh" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=5" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Create src/lib/api-client.ts\n- Implement automatic token refresh on 401\n- Add request/response interceptors\n- Type-safe API methods" \
    "System.Tags=High,Frontend,API" \
    "System.Parent=$EPIC5"

# Work Item 5.5: Loading State Standardization
echo "Creating Work Item 5.5: Standardize Loading States..."
az boards work-item create \
  --title "WI 5.5: Standardize Loading State Handling" \
  --type "User Story" \
  --area "$AREA" \
  --iteration "$ITERATION" \
  --fields \
    "System.AssignedTo=Frontend-Data-Agent-05" \
    "System.Description=Create consistent loading state components and error boundaries" \
    "Microsoft.VSTS.Common.Priority=2" \
    "Microsoft.VSTS.Scheduling.Effort=3" \
    "Microsoft.VSTS.Common.AcceptanceCriteria=- Create LoadingSpinner component\n- Create ErrorBoundary component\n- Create EmptyState component\n- Replace 20+ custom loading implementations" \
    "System.Tags=High,Frontend,UX" \
    "System.Parent=$EPIC5"

echo ""
echo "============================================"
echo "✅ Successfully created all work items!"
echo "============================================"
echo ""
echo "Summary:"
echo "- Epic 1: Backend Architecture (11 work items, 3 completed)"
echo "- Epic 2: Backend API & Data (7 work items, 2 completed)"
echo "- Epic 3: Backend Security (8 work items)"
echo "- Epic 4: Frontend Architecture (11 work items)"
echo "- Epic 5: Frontend Data Fetching (5 work items)"
echo ""
echo "Total: 42 work items created (3 marked as completed)"
echo ""
echo "View in Azure DevOps:"
echo "$ORG/$PROJECT/_workitems"
