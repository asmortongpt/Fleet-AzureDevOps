# Vendor Quality & Critique Rubric

## 1. Agent Workflow Requirements
*   **RAG First**: Reference `artifacts/standards_library/` before writing code.
*   **Critique Loop**: Evaluate output against this rubric before finalizing.
*   **Evidence-Based**: Don't just say "it works". Verify with tests or logs.

## 2. Code Quality Rubric
*   [ ] **Modularity**: Functions are small (< 50 lines), single responsibility.
*   [ ] **Naming**: Descriptive variables (`vehicleStatus` vs `vs`). Boolean variables start with `is`, `has`, `should`.
*   [ ] **Comments**: "Why" not "What". Complex logic has block comments.
*   [ ] **Magic Numbers**: All extracted to constants or config.

## 3. Security Quality Rubric
*   [ ] **Input**: All inputs validated against strict schema?
*   [ ] **Auth**: Is `req.user` checked for ownership of the resource?
*   [ ] **Output**: Is sensitive data (PII, secrets) masked or excluded?
*   [ ] **Logs**: Are no secrets logged?

## 4. UI/UX Quality Rubric
*   [ ] **Consistency**: Uses design tokens (colors, spacing) from `index.css` or `tailwind.config.js`.
*   [ ] **Responsiveness**: Tested on mobile view?
*   [ ] **Empty States**: Handled?
*   [ ] **Loading**: Skeletons or spinners shown?
*   [ ] **Feedback**: Success/Error toasts on submission?

## 5. Business Process Sufficiency
*   [ ] **Completeness**: Can the user actually achieve the business goal (e.g., "Add Vehicle" includes insurance info)?
*   [ ] **Drilldown**: Can I click a summary to see the details?
*   [ ] **Export**: Can I get this data out?
