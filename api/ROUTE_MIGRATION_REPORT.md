# Route Migration Report

## Summary

- **Total Route Files:** 175
- **CRUD Candidate Files:** 50 (28.6%)
- **Current Lines of Code:** 61,320
- **Estimated After Migration:** 44,784
- **Code Reduction:** 16,536 lines (27.0%)

## Top 20 Candidates for Migration

| File | Lines | Reduction | Patterns |
|------|-------|-----------|----------|
| scheduling.routes.ts | 918 | -883 | CRUD |
| reservations.routes.ts | 902 | -867 | CRUD, Auth |
| documents.ts | 808 | -773 | CRUD, Auth, Valid, Filter |
| alerts.routes.ts | 804 | -769 | CRUD, Auth, Valid |
| vehicle-assignments.routes.ts | 793 | -758 | CRUD, Auth |
| teams.routes.ts | 750 | -715 | CRUD, Auth |
| maintenance-schedules.ts | 733 | -698 | CRUD, Auth, Valid, Filter |
| outlook.routes.ts | 699 | -664 | CRUD, Auth, Valid, Filter |
| mobile-notifications.routes.ts | 662 | -627 | CRUD, Auth |
| asset-management.routes.ts | 652 | -617 | CRUD, Auth, Filter |
| on-call-management.routes.ts | 640 | -605 | CRUD, Auth |
| documents.routes.ts | 619 | -584 | CRUD, Auth, Filter |
| push-notifications.routes.ts | 596 | -561 | CRUD, Auth |
| communications.ts | 566 | -531 | CRUD, Auth, Valid, Cache, Filter |
| asset-relationships.routes.ts | 499 | -464 | CRUD, Auth |
| inspections.dal-example.ts | 488 | -453 | CRUD, Auth, Valid |
| cost-benefit-analysis.routes.ts | 462 | -427 | CRUD, Auth |
| damage-reports.ts | 425 | -390 | CRUD, Auth, Valid |
| permissions.routes.ts | 411 | -376 | CRUD |
| custom-reports.routes.ts | 410 | -375 | CRUD, Auth |

## Pattern Analysis

- **Authentication:** 128 files (73.1%)
- **Validation:** 59 files (33.7%)
- **Caching:** 18 files (10.3%)
- **Pagination:** 3 files (1.7%)
- **Filtering:** 33 files (18.9%)

## Duplication Metrics

**Current Duplication Level:** 27.0%

This represents approximately 16,536 lines of duplicate or boilerplate code that can be eliminated using the CRUD factory pattern.

## Migration Strategy

1. **Phase 1:** Migrate top 10 high-value routes (saves ~2,000+ lines)
2. **Phase 2:** Migrate remaining CRUD routes (saves ~13229 lines)
3. **Phase 3:** Refactor complex routes to use helper utilities
4. **Phase 4:** Add export endpoints using export helpers

## Next Steps

- [ ] Review this report
- [ ] Test refactored vehicles.ts and drivers.ts
- [ ] Create migration PRs for high-value routes
- [ ] Update documentation and examples
- [ ] Train team on new patterns
