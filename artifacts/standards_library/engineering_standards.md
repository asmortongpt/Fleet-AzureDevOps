# Engineering & Code Quality Standards

## 1. Technology Stack
*   **Frontend**: React, TypeScript, Vite, TailwindCSS (strict configuration), framer-motion.
*   **Backend**: Node.js, Express, TypeScript.
*   **Database**: PostgreSQL (TimescaleDB extension preferred for telemetry).
*   **Cache**: Redis (for session store & heavy query caching).
*   **API Pattern**: RESTful, predictable resource URLs (/api/v1/resource).

## 2. TypeScript Best Practices
*   **Strict Mode**: `strict: true` in tsconfig. No `any`.
*   **Types**: Shared types package or strict interface definitions. Prefer `interface` over `type` for objects.
*   **Async/Await**: No `.then()` chains. Always use `async/await` with `try/catch`.
*   **Null Safety**: Explicit null checks. Use optional chaining `?.` conservatively but effectively.

## 3. API & Backend Standards
*   **Validation**: Zod or Joi for runtime schema validation on ALL inputs.
*   **Error Handling**: Global error handler middleware. Uniform error response structure:
    ```json
    {
      "success": false,
      "error": { "code": "INVALID_INPUT", "message": "VIN is required", "details": [...] }
    }
    ```
*   **Idempotency**: POST requests should support `Idempotency-Key` header where critical.
*   **Pagination**: Cursor-based preferred for infinite logic; Offset-based for pages. Always limit max page size.

## 4. Database Patterns
*   **Transactions**: All multi-step writes MUST be in a transaction.
*   **Migrations**: Immutable migration files. No modifying old migrations.
*   **Indexes**: Index all foreign keys and frequently queried columns (user_id, status, created_at).
*   **Soft Deletes**: Use `deleted_at` timestamp instead of `DELETE` for core business records.

## 5. Testing Standards
*   **Unit**: Jest/Vitest. 80% coverage on utils/business logic.
*   **Integration**: Supertest against API.
*   **E2E**: Playwright. Visual regression tests required for all UI components.
*   **Flakeness**: Zero tolerance. Retries allowed only if network-related.

## 6. PR & Code Review Rubric
*   **Size**: < 400 lines of code changes preferred.
*   **Context**: PR description explains "Why" and "How".
*   **Evidence**: "Before" vs "After" screenshots/videos for UI.
*   **Reversibility**: Can this be rolled back easily?
*   **Docs**: Updated README or API specs if interfaces changed.
