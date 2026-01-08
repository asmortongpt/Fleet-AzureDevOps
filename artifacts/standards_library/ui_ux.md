# UI/UX Standards & Design System

## 1. Usability Principles (Nielsen's Heuristics)
1. **Visibility of System Status**: Improvements need loaders, progress bars, and success toasts.
2. **Match System & Real World**: Use industry terminology (Fleet, VIN, Driver, Manifest).
3. **User Control & Freedom**: "Undo", "Cancel", and "Go Back" must be available.
4. **Consistency & Standards**: Same buttons, colors, and layout across all pages.
5. **Error Prevention**: Confirmation modals for destructive actions.

## 2. Accessibility (WCAG 2.2 AA)
- **Contrast**: Text vs Background must be at least 4.5:1.
- **Keyboard Navigation**: All interactive elements must be focusable (visible ring).
- **Screen Readers**: `aria-label` for icons, proper semantic HTML (`<nav>`, `<main>`, `<h1>`).
- **Reduced Motion**: Respect `prefers-reduced-motion` media query.

## 3. Visual Design & Microinteractions

### "The Premium Feel"
- **Glassmorphism**: Use translucent backgrounds (`backdrop-filter: blur`) for panels/modals.
- **Borders**: Subtle, 1px borders with low opacity to define hierarchy.
- **Shadows**: Soft, diffuse shadows for depth (elevation system).

### Microinteractions
- **Hover**: Elements must subtly change scale (1.02), brightness, or background color on hover.
- **Click**: Active state should show depression or ripple.
- **Loading**: Skeletons preferred over generic spinners for page loads.
- **Feedback**: Immediate validation inline (green check, red X).

## 4. Component Patterns

### Enterprise Data Tables
- **Requirements**:
    - Density selector (Compact/Comfortable).
    - Sortable columns (Server-side).
    - Filterable columns (Server-side).
    - Pagination (Server-side).
    - "Select All" / "Bulk Actions".
    - Sticky Header.
    - Export to CSV/PDF.

### Dashboards
- **Layout**: Grid-based content.
- **Hierarchy**:
    1. Key Metrics (KPI Cards) at top.
    2. Trend Charts (Visuals) in middle.
    3. Detailed Lists (Tables) at bottom.
- **Drilldown**: Clicking a chart segment filters the list below or navigates to a detail view.

### Forms & Input
- **Validation**: Real-time validation (onBlur).
- **Labels**: Always visible or floating (Material style).
- **Error Messages**: Explicit help text below the field in red.
