# Storybook Mock Data

## Purpose
The mock data in this directory is used **ONLY** for Storybook component documentation and development. It is NOT used in the production application.

## Files
- `mockData.ts` - Mock data generators for Storybook stories
- Component `.stories.tsx` files - Storybook component documentation with mock data

## Important Notes
- **Production code does NOT use these mocks**
- All production data flows through real API endpoints in `src/hooks/use-api.ts`
- All vehicles, drivers, work orders, etc. come from the PostgreSQL database
- This directory is excluded from production builds

## Verification
To verify mock data is not used in production:
```bash
# Search for imports of mock data in non-story files
grep -r "from.*mockData" src --include="*.tsx" --include="*.ts" | grep -v ".stories.tsx"
# Should return no results
```

Last updated: 2026-02-06
