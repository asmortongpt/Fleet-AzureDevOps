# UI/UX Design & Usability Standards

## 1. Design System & Aesthetics
*   **Visual Style**: "Premium Enterprise" - Glassmorphism, translucent panels, subtle gradients (HSL).
*   **Typography**: Inter or localized equivalent. Scalable type scale.
*   **Dark Mode**: Default or first-class citizen. High contrast text on dark backgrounds.
*   **Microinteractions**:
    *   Buttons: Transform/scale/shadow shift on hover/active.
    *   Inputs: Ring glow on focus.
    *   Transitions: Smooth exit/enter animations (200-300ms).

## 2. Usability Heuristics (Nielsen)
1.  **Visibility of System Status**: Loading skeletons, progress bars, toast notifications for all actions.
2.  **Match between System and Real World**: Use industry terminology (Fleet, VIN, etc.).
3.  **User Control & Freedom**: Undo actions, easy "Back", cancelable long transfers.
4.  **Consistency**: Same search bar, same filter logic, same button placement across all pages.
5.  **Error Prevention**: Confirmation modals for destructive actions. Validation on blur.

## 3. Accessibility (WCAG 2.2 AA)
*   **Contrast**: 4.5:1 minimum for text.
*   **Keyboard Nav**: All interactive elements focusable and actionable via keyboard. Visual focus ring required.
*   **Screen Readers**: ARIA labels on icon-only buttons. Semantic HTML (h1-h6 hierarchy).
*   **Motion**: `prefers-reduced-motion` media query respect.

## 4. Enterprise Components
### 4.1 Data Tables
*   **Features**: Sortable headers, server-side pagination, movable columns, density toggle.
*   **Actions**: Row hover actions, multi-select bulk actions.
*   **Export**: CSV/PDF export built-in.

### 4.2 Dashboards & Drilldown
*   **Hierarchy**: KPI Cards (Top) -> Charts (Middle) -> Data Tables (Bottom).
*   **Interactivity**: Clicking a Chart Slice filters the Table below. Clicking a KPI opens a meaningful drilldown report.
*   **Empty States**: Never show valid "0" as just "No Data". Explain *why* or offer an action to add data.

## 5. Mobile & Responsive
*   **Grid**: 12-column fluid grid.
*   **Touch Targets**: Minimum 44x44px.
*   **Navigation**: Hamburger/Sidebar collapse for screens < 1024px.
