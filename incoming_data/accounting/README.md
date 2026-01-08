# Fleet – Accounting-Grade Depreciation with Components + Controls (Best-Practice Drop-in)

This package adds accounting-grade depreciation for assets with **capital modifications/components** (dump beds, liftgates, bumpers, cranes, etc.), plus:
- **DB constraints** for correctness
- **Service-level validation** with warnings/overrides
- **Audit logging**
- **Accounting period close + snapshots** (immutable checkpoints)
- **Reconciliation endpoints** (invariants)
- **Policy tables** (useful life rules, capitalization thresholds) enabling RAG/CAG/MCP later

## Contents
- `sql/migrations/` – Postgres migrations
- `api/` – TypeScript (Express + pg) reference implementation
- `docs/` – Policy + integration guidance
- `tests/` – Example unit tests for depreciation math + validation

## Assumptions
- Postgres
- Node/TS backend
- `db.query(sql, params)` pattern
- Existing `assets` table with `id`

## Quick Start
1) Apply migrations in `sql/migrations` in order.
2) Copy `api/src/**` into your backend (adjust imports).
3) Register routes from `api/src/routes/index.ts` in your server.
4) Populate `useful_life_rules` and `accounting_policies`.
5) Use `/accounting/periods` endpoints to create/close periods.
6) Use `/assets/:id/components` endpoints to manage modifications.
7) Use `/assets/:id/depreciation` for calculations and `/validate` for invariants.

## Key Endpoints
- Components:
  - `GET /assets/:assetId/components`
  - `POST /assets/:assetId/components`
  - `PATCH /assets/:assetId/components/:componentId`
  - `POST /assets/:assetId/components/:componentId/dispose`
- Depreciation:
  - `GET /assets/:assetId/depreciation?asOf=YYYY-MM-DD`
  - `GET /assets/:assetId/depreciation/validate?asOf=YYYY-MM-DD`
- Periods:
  - `GET /accounting/periods`
  - `POST /accounting/periods`
  - `POST /accounting/periods/:periodId/close`

## Safety Model
This system prevents silent accounting corruption by:
- locking edits that would affect **closed periods**
- recording every change in `audit_log`
- enforcing core invariants with `/validate` and DB constraints

## Extending to MACRS / Tax
You can add `depreciation_method` values and implement method calculators in
`api/src/services/depreciation/methods/*`.

---
