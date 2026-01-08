# Engineering & Code Quality Standards

## 1. TypeScript & Frontend
- **Strict Mode**: `strict: true` in tsconfig.
- **No Any**: Avoid `any`. Use `unknown` or define interface.
- **Interfaces**: Prefer `interface` over `type` for object definitions.
- **Components**:
    - Functional Components only.
    - Props interface defined and exported.
    - Use "Composition" over "Prop Drilling".
- **State Management**:
    - URL as source of truth for filters/navigation.
    - React Query (TanStack Query) for server state.
    - Context/Zustand for global client state.

## 2. Backend (Node.js/Express)
- **Architecture**: Controller-Service-Repository pattern.
- **Async Handling**: Use `express-async-errors` or wrapper.
- **Validation**: Zod schemas for all request bodies/params.
- **Error Handling**: Centralized middleware. Return standard error definition (RFC 7807 problem details).
- **Logging**: Structured JSON logging (Winston/Pino) with correlation IDs.

## 3. Database (Postgres)
- **Migrations**: All schema changes must use migrations.
- **Naming**: `snake_case` for tables and columns.
- **Keys**: UUIDs (v4 or v7) for primary keys.
- **Constraints**: Enforce foreign keys and unique constraints at DB level.
- **Performance**:
    - Index foreign keys.
    - Index filtered/sorted columns.
    - Use `EXPLAIN ANALYZE` for slow queries.

## 4. Testing Strategy
- **Unit**: Jest/Vitest. Logic isolation. Coverage > 80%.
- **Integration**: Supertest. API logic + DB.
- **E2E**: Playwright. Critical user flows.
    - Independent test data (seed per run or explicit cleanup).
    - Visual regression snapshots for UI components.
- **Flakiness**: No sleeps/waits. Use `await expect().toBeVisible()`.

## 5. PR Quality
- **Size**: Small, focused PRs (<400 lines).
- **Description**: What, Why, and Screenshots.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`).
- **Review**: Self-review before request. All CI checks green.
