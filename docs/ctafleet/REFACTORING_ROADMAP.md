# CTAFleet Refactoring Roadmap

**Target:** Migrate 62+ CTAFleet components to Fleet design system
**Timeline:** 2-4 weeks
**Priority:** HIGH

## Overview

CTAFleet components use Material-UI v7 and Emotion for styling. Fleet uses Radix UI primitives and Tailwind CSS. This roadmap outlines the systematic migration strategy.

## Phase 1: Automated Migration (Week 1)

### 1.1 Create Migration Scripts

#### Script 1: Component Import Replacement
```typescript
// scripts/refactor/replace-mui-imports.ts
import * as fs from 'fs';
import * as path from 'path';

const replacements = {
  // Buttons
  "@mui/material/Button": "@/components/ui/button",

  // Dialogs
  "@mui/material/Dialog": "@radix-ui/react-dialog",
  "@mui/material/DialogTitle": "@radix-ui/react-dialog",
  "@mui/material/DialogContent": "@radix-ui/react-dialog",
  "@mui/material/DialogActions": "@radix-ui/react-dialog",

  // Forms
  "@mui/material/TextField": "@/components/ui/input",
  "@mui/material/Select": "@radix-ui/react-select",
  "@mui/material/MenuItem": "@radix-ui/react-select",
  "@mui/material/Checkbox": "@radix-ui/react-checkbox",
  "@mui/material/Radio": "@radix-ui/react-radio-group",
  "@mui/material/Switch": "@radix-ui/react-switch",

  // Layout
  "@mui/material/Box": "div with className",
  "@mui/material/Container": "div with container classes",
  "@mui/material/Grid": "div with grid classes",
  "@mui/material/Stack": "div with flex classes",

  // Data Display
  "@mui/material/Table": "@/components/ui/table",
  "@mui/material/TableBody": "@/components/ui/table",
  "@mui/material/TableCell": "@/components/ui/table",
  "@mui/material/TableHead": "@/components/ui/table",
  "@mui/material/TableRow": "@/components/ui/table",

  // Feedback
  "@mui/material/Alert": "@/components/ui/alert",
  "@mui/material/Snackbar": "react-hot-toast",
  "@mui/material/CircularProgress": "@/components/ui/spinner",
  "@mui/material/LinearProgress": "@radix-ui/react-progress",

  // Navigation
  "@mui/material/Tabs": "@radix-ui/react-tabs",
  "@mui/material/Tab": "@radix-ui/react-tabs",
  "@mui/material/Breadcrumbs": "@/components/ui/breadcrumb",

  // Surfaces
  "@mui/material/Card": "@/components/ui/card",
  "@mui/material/CardContent": "@/components/ui/card",
  "@mui/material/CardActions": "@/components/ui/card",
  "@mui/material/Paper": "div with card classes",

  // Utils
  "@mui/material/Tooltip": "@radix-ui/react-tooltip",
  "@mui/material/Popover": "@radix-ui/react-popover",
  "@mui/material/Menu": "@radix-ui/react-dropdown-menu",
};

function replaceImports(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');

  Object.entries(replacements).forEach(([from, to]) => {
    content = content.replace(
      new RegExp(`from ['"]${from}['"]`, 'g'),
      `from '${to}'`
    );
  });

  fs.writeFileSync(filePath, content, 'utf-8');
}
```

#### Script 2: Style Migration
```typescript
// scripts/refactor/migrate-sx-to-tailwind.ts

const sxToTailwind = {
  // Spacing
  "p: 2": "p-4",
  "p: 3": "p-6",
  "m: 2": "m-4",
  "mt: 2": "mt-4",
  "mb: 2": "mb-4",

  // Flexbox
  "display: 'flex'": "flex",
  "flexDirection: 'column'": "flex-col",
  "justifyContent: 'center'": "justify-center",
  "alignItems: 'center'": "items-center",
  "gap: 2": "gap-4",

  // Colors
  "bgcolor: 'primary.main'": "bg-primary",
  "color: 'primary.main'": "text-primary",
  "bgcolor: 'background.paper'": "bg-card",

  // Typography
  "fontWeight: 'bold'": "font-bold",
  "fontSize: 14": "text-sm",
  "fontSize: 16": "text-base",

  // Borders
  "borderRadius: 1": "rounded",
  "borderRadius: 2": "rounded-lg",
  "border: 1": "border",
};

function migrateSxProps(content: string): string {
  // Find all sx={{ ... }} patterns
  const sxPattern = /sx=\{\{([^}]+)\}\}/g;

  return content.replace(sxPattern, (match, sxContent) => {
    let classes: string[] = [];

    Object.entries(sxToTailwind).forEach(([sx, tailwind]) => {
      if (sxContent.includes(sx)) {
        classes.push(tailwind);
      }
    });

    return `className="${classes.join(' ')}"`;
  });
}
```

### 1.2 Component Mapping Guide

| Material-UI | Radix UI / Fleet Component |
|-------------|---------------------------|
| `<Button>` | `<Button>` from @/components/ui/button |
| `<Dialog>` | `<Dialog>` from @radix-ui/react-dialog |
| `<TextField>` | `<Input>` from @/components/ui/input |
| `<Select>` | `<Select>` from @radix-ui/react-select |
| `<Checkbox>` | `<Checkbox>` from @radix-ui/react-checkbox |
| `<Table>` | `<Table>` from @/components/ui/table |
| `<Alert>` | `<Alert>` from @/components/ui/alert |
| `<Tabs>` | `<Tabs>` from @radix-ui/react-tabs |
| `<Card>` | `<Card>` from @/components/ui/card |
| `<Tooltip>` | `<Tooltip>` from @radix-ui/react-tooltip |

## Phase 2: Manual Refactoring (Week 2)

### 2.1 Complex Components Requiring Manual Migration

#### Priority 1: High-Value Business Components
1. **FLAIRApprovalDashboard.tsx** (Accounting)
   - Material-UI DataGrid → Tanstack Table
   - MUI Charts → Recharts
   - Emotion styling → Tailwind

2. **FLAIRExpenseSubmission.tsx** (Accounting)
   - MUI Forms → React Hook Form + Radix primitives
   - File upload → React Dropzone
   - Validation → Zod

3. **Enhanced3DVehicleShowroom.tsx** (Fleet 3D)
   - Minimal MUI usage (mostly Three.js)
   - Update UI controls to Radix
   - Maintain React Three Fiber core

#### Priority 2: Shared Infrastructure
4. **AuthContext.tsx** (Multi-tenant)
   - MSAL integration (keep as-is)
   - Update UI notifications to toast

5. **FleetDataContext.tsx** (Multi-tenant)
   - Data fetching (keep as-is)
   - Error UI → Fleet error boundaries

### 2.2 Theme Migration

#### Remove Material-UI Theme
```typescript
// Before (CTAFleet)
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

#### Replace with Fleet Theme
```typescript
// After (Fleet)
import { ThemeProvider } from '@/components/theme-provider';

<ThemeProvider defaultTheme="system" storageKey="fleet-theme">
  <App />
</ThemeProvider>
```

#### Update CSS Variables
```css
/* Fleet theme (Tailwind + CSS variables) */
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --muted: 210 40% 96.1%;
  --card: 0 0% 100%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}
```

## Phase 3: Testing & Validation (Week 3)

### 3.1 Unit Tests

Create tests for each refactored component:

```typescript
// Example: accounting/FLAIRApprovalDashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { FLAIRApprovalDashboard } from './FLAIRApprovalDashboard';

describe('FLAIRApprovalDashboard', () => {
  it('renders approval table', () => {
    render(<FLAIRApprovalDashboard />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('handles approval action', async () => {
    // Test approval workflow
  });

  it('validates expense data', () => {
    // Test data validation
  });
});
```

### 3.2 Visual Regression Tests

```typescript
// storybook/FLAIRApprovalDashboard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { FLAIRApprovalDashboard } from '@/features/business/accounting';

const meta: Meta<typeof FLAIRApprovalDashboard> = {
  title: 'Business/Accounting/FLAIRApprovalDashboard',
  component: FLAIRApprovalDashboard,
};

export default meta;
type Story = StoryObj<typeof FLAIRApprovalDashboard>;

export const Default: Story = {};
export const WithApprovals: Story = {
  args: {
    approvals: mockApprovals,
  },
};
```

### 3.3 E2E Tests

```typescript
// e2e/business/accounting.spec.ts
import { test, expect } from '@playwright/test';

test('FLAIR approval workflow', async ({ page }) => {
  await page.goto('/accounting/approvals');

  // Verify dashboard loads
  await expect(page.getByRole('heading', { name: 'Approvals' })).toBeVisible();

  // Approve an expense
  await page.getByRole('button', { name: 'Approve' }).first().click();
  await expect(page.getByText('Expense approved')).toBeVisible();
});
```

## Phase 4: Documentation (Week 4)

### 4.1 Component Documentation

Create usage guides for each business domain:

```markdown
# Accounting Module

## FLAIRApprovalDashboard

### Usage

import { FLAIRApprovalDashboard } from '@/features/business/accounting';

<FLAIRApprovalDashboard
  onApprove={(expense) => console.log('Approved:', expense)}
  onReject={(expense) => console.log('Rejected:', expense)}
/>


### Props

| Prop | Type | Description |
|------|------|-------------|
| `onApprove` | `(expense: Expense) => void` | Callback when expense approved |
| `onReject` | `(expense: Expense) => void` | Callback when expense rejected |
```

### 4.2 Migration Checklist

- [ ] All Material-UI imports replaced
- [ ] Emotion styling migrated to Tailwind
- [ ] Theme provider updated
- [ ] Unit tests added
- [ ] E2E tests added
- [ ] Storybook stories created
- [ ] Accessibility audited
- [ ] Mobile responsive
- [ ] Documentation written

## Detailed Component Breakdown

### Accounting Components (2 files)
- [ ] FLAIRApprovalDashboard.tsx - **Complex** (DataGrid, Charts)
- [ ] FLAIRExpenseSubmission.tsx - **Complex** (Multi-step form)

### Analytics Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Finance Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Procurement Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Inventory Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### HR Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Projects Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Academy Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Calendar Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Forms Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Reports Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Safety Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Maintenance Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### CRM Components (TBD)
- [ ] Analyze and map components
- [ ] Prioritize by usage

### Fleet 3D Components (12 files)
- [ ] Enhanced3DVehicleShowroom.tsx - **Simple** (Minimal MUI)
- [ ] PhotorealisticVehicleShowroom.tsx - **Simple**
- [ ] ConfigurableVehicleShowroom.tsx - **Simple**
- [ ] PerfectVehicleShowroom.tsx - **Simple**
- [ ] ProfessionalVehicleShowroom.tsx - **Simple**
- [ ] EnhancedVehicleShowroom.tsx - **Simple**
- [ ] (6 more showroom variants)

## Automation Tools

### 1. Codemod for Bulk Migration
```bash
# Run codemod on all business components
npx jscodeshift -t scripts/refactor/mui-to-radix.ts src/features/business/**/*.tsx
```

### 2. ESLint Rules
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": ["@mui/*", "@emotion/*"]
    }]
  }
}
```

### 3. Pre-commit Hooks
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Prevent Material-UI imports
git diff --cached --name-only | grep '\.tsx\?$' | xargs grep -l '@mui/' && {
  echo "Error: Material-UI imports detected. Use Radix UI instead."
  exit 1
}
```

## Success Criteria

### Technical
- [ ] Zero Material-UI dependencies in package.json
- [ ] Zero Emotion dependencies
- [ ] All components use Radix UI + Tailwind
- [ ] 90%+ test coverage on refactored components
- [ ] Storybook stories for all components

### Visual
- [ ] Consistent with Fleet design system
- [ ] WCAG 2.2 AA compliant
- [ ] Mobile responsive
- [ ] Dark mode support

### Performance
- [ ] Bundle size reduction (remove MUI)
- [ ] Lighthouse score 90+ on all pages
- [ ] No runtime theme switching overhead

## Rollback Plan

If issues arise:
1. Revert to `main` branch
2. Fix issues on feature branch
3. Re-merge when stable

Git commands:
```bash
# Create backup before starting
git checkout feature/integrate-ctafleet-components
git checkout -b backup/ctafleet-before-refactor

# If rollback needed
git checkout feature/integrate-ctafleet-components
git reset --hard backup/ctafleet-before-refactor
```

## Support

For questions or issues during migration:
- **Design System:** Fleet docs/design-system/
- **Radix UI:** https://www.radix-ui.com/
- **Tailwind CSS:** https://tailwindcss.com/
- **Storybook:** Fleet Storybook instance

---

**Last Updated:** 2025-12-31
**Status:** DRAFT - Pending PR approval
**Owner:** Autonomous Product Builder (Claude Code)
