# UI Redesign Plan

**Generated:** 2025-12-24T22:40:00-05:00
**Branch:** consolidate/plan

---

## Design System Rules

### Typography Scale
```css
--font-family: 'Inter', system-ui, sans-serif;
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

### Color Palette
```css
/* Primary */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Neutral */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-500: #6b7280;
--gray-700: #374151;
--gray-900: #111827;

/* Status */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

---

## Component Conventions

### Cards
- Rounded corners: 8px
- Padding: 16-24px
- Border: 1px solid gray-200
- Shadow: sm (0 1px 2px rgba(0,0,0,0.05))

### Buttons
- Primary: blue-600 bg, white text
- Secondary: gray-100 bg, gray-700 text
- Outline: white bg, gray-300 border
- Height: 36px (sm) / 40px (md) / 48px (lg)
- Border radius: 6px

### Tables
- Header: gray-50 bg, semibold text
- Row hover: gray-50
- Row border: gray-200
- Cell padding: 12px 16px
- Virtual scrolling for 50+ rows

### Forms
- Label: text-sm, gray-700, medium
- Input height: 40px
- Input border: gray-300
- Focus ring: blue-500
- Error border: red-500

### Modals
- Max width: sm (384px), md (448px), lg (512px), xl (576px)
- Padding: 24px
- Overlay: black/50

---

## Navigation Structure

### Primary Navigation (Sidebar)
```
┌─────────────────────────┐
│ ⚡ Fleet Command        │
├─────────────────────────┤
│ 🚗 Fleet Hub           │ ← Default
│ 🎯 Operations Hub      │
│ 🔧 Maintenance Hub     │
│ 👥 Drivers Hub         │
│ 📊 Analytics Hub       │
├─────────────────────────┤
│ 🛡️ Compliance Hub      │
│ 📦 Procurement Hub     │
│ 🏢 Assets Hub          │
│ ⚠️ Safety Hub          │
├─────────────────────────┤
│ 💬 Communication Hub   │
│ ⚙️ Admin Hub           │
└─────────────────────────┘
```

### Hub Page Structure
```
┌──────────────────────────────────────────────────┐
│ [Hub Icon] Hub Name                    [Actions] │
├──────────────────────────────────────────────────┤
│ Tab1 | Tab2 | Tab3 | Tab4                        │
├──────────────────────────────────────────────────┤
│                                                  │
│   Tab Content Area                               │
│   (List / Map / Detail / Form)                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

### List/Detail Pattern
```
List View → Detail View → Edit View
   ↓
   Click row or "+ New" button
   ↓
   Opens detail slide-over or modal
   ↓
   Edit button opens edit mode
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Focus indicators visible and consistent
- [ ] Keyboard navigation for all interactions
- [ ] Screen reader announcements for dynamic content
- [ ] Skip links for main content
- [ ] ARIA labels on interactive elements
- [ ] Form validation announcements

### Keyboard Shortcuts
- `Cmd/Ctrl + K`: Global search
- `Escape`: Close modal/overlay
- `Tab`: Navigate focus
- `Enter/Space`: Activate buttons
- `Arrow keys`: Navigate lists/menus

---

## Performance Constraints

### Bundle Size
- Target: <500KB gzipped per route chunk
- Lazy load all hub components
- Code split at route level

### Render Performance
- Virtual scrolling for lists >50 items
- React.memo for expensive components
- useMemo/useCallback for computed values
- Debounce search inputs (300ms)

### Network
- API response caching with React Query
- Optimistic updates for mutations
- Request batching where applicable

---

## Component Library

### Standardized Components (shadcn/ui base)
| Component | Usage |
|-----------|-------|
| Button | All actions |
| Card | Content containers |
| Dialog | Modals |
| Sheet | Slide-overs |
| Table | Data lists |
| Tabs | Hub navigation |
| Form | All forms |
| Input | Text input |
| Select | Dropdowns |
| Checkbox | Multi-select |
| RadioGroup | Single select |
| DatePicker | Date selection |
| Toast | Notifications |
| Avatar | User/entity images |
| Badge | Status indicators |
| Progress | Loading states |

### Custom Components
| Component | Purpose |
|-----------|---------|
| HubPage | Hub layout wrapper |
| DataTable | Virtual scrolling table |
| UniversalMap | Map integration |
| EntityCard | Entity preview cards |
| StatCard | KPI display |
| FilterBar | List filtering |
| SearchCommand | Global search |

---

## Empty/Loading/Error States

### Loading
- Skeleton placeholders matching content shape
- Centered spinner for full-page loads
- Progress bar for multi-step operations

### Empty
- Illustration + title + description
- Primary action button (e.g., "Add First Vehicle")
- Secondary help text

### Error
- Red alert banner
- Error title + message
- Retry button
- Contact support link

---

## Implementation Priority

### Week 1
1. Design tokens (CSS variables)
2. Base component library
3. Hub page template
4. Navigation sidebar

### Week 2
5. Data table with virtual scrolling
6. Form components
7. Modal/sheet components
8. Toast notifications

### Week 3
9. Map integration
10. Chart components
11. Dark mode support
12. Final polish
