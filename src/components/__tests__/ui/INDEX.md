# UI Component Tests - Quick Index

## Test Files Overview

### Form Input Components

#### [Button.test.tsx](./Button.test.tsx)
- **Tests**: 210+
- **Coverage**: Variants (8), Sizes (8), States (5), Events, Accessibility
- **Key Tests**: All variant/size combinations, loading state, disabled state, click events, keyboard navigation
- **Lines**: ~950
```bash
npm test -- src/components/__tests__/ui/Button.test.tsx --run
```

#### [Input.test.tsx](./Input.test.tsx)
- **Tests**: 200+
- **Coverage**: Types (9), States (5), Attributes (10+), Events, Accessibility
- **Key Tests**: Text input, email, password, number, date, file input, focus/blur, validation
- **Lines**: ~850
```bash
npm test -- src/components/__tests__/ui/Input.test.tsx --run
```

#### [Checkbox.test.tsx](./Checkbox.test.tsx)
- **Tests**: 70
- **Coverage**: States (5), Events (6), Attributes, Form integration, Accessibility
- **Key Tests**: Checked/unchecked, indeterminate, disabled, toggle, form submission
- **Lines**: ~450
```bash
npm test -- src/components/__tests__/ui/Checkbox.test.tsx --run
```

#### [RadioGroup.test.tsx](./RadioGroup.test.tsx)
- **Tests**: 85
- **Coverage**: Selection (1-of-many), States, Keyboard navigation, Form integration
- **Key Tests**: Single selection, disabled options, arrow key nav, form data
- **Lines**: ~520
```bash
npm test -- src/components/__tests__/ui/RadioGroup.test.tsx --run
```

#### [Switch.test.tsx](./Switch.test.tsx)
- **Tests**: 90
- **Coverage**: States (4), Events (5), Attributes, Form integration, Accessibility
- **Key Tests**: Toggle behavior, disabled state, keyboard support, form submission
- **Lines**: ~500
```bash
npm test -- src/components/__tests__/ui/Switch.test.tsx --run
```

#### [Label.test.tsx](./Label.test.tsx)
- **Tests**: 41
- **Coverage**: Form association, Content variants, Attributes, Accessibility
- **Key Tests**: htmlFor association, input binding, peer styling, form integration
- **Lines**: ~360
```bash
npm test -- src/components/__tests__/ui/Label.test.tsx --run
```

### Display Components

#### [Button.test.tsx](./Button.test.tsx)
- **Tests**: 210+
- **Coverage**: Variants (8), Sizes (8), States (5), Events, Accessibility
- **Key Tests**: Primary, secondary, destructive, success, warning variants
- **Lines**: ~950
```bash
npm test -- src/components/__tests__/ui/Button.test.tsx --run
```

#### [Badge.test.tsx](./Badge.test.tsx)
- **Tests**: 80
- **Coverage**: Variants (8), Content, Icons, Use cases, Accessibility
- **Key Tests**: Status indicator, tag, count badge, all variant styles
- **Lines**: ~480
```bash
npm test -- src/components/__tests__/ui/Badge.test.tsx --run
```

#### [Card.test.tsx](./Card.test.tsx)
- **Tests**: 39
- **Coverage**: Structure (5 parts), Layout, Content variants, Accessibility
- **Key Tests**: Header/content/footer composition, title/description, nesting
- **Lines**: ~360
```bash
npm test -- src/components/__tests__/ui/Card.test.tsx --run
```

#### [Alert.test.tsx](./Alert.test.tsx)
- **Tests**: 81
- **Coverage**: Variants (5), Composition (3), Icons, Use cases, Accessibility
- **Key Tests**: Error/success/warning/info alerts, icon support, composition
- **Lines**: ~520
```bash
npm test -- src/components/__tests__/ui/Alert.test.tsx --run
```

#### [Spinner.test.tsx](./Spinner.test.tsx)
- **Tests**: 70
- **Coverage**: Variants (7), Sizes (6), Animation, Theming, Accessibility
- **Key Tests**: Color variants, size variations, animation, use cases
- **Lines**: ~420
```bash
npm test -- src/components/__tests__/ui/Spinner.test.tsx --run
```

#### [Progress.test.tsx](./Progress.test.tsx)
- **Tests**: 42
- **Coverage**: Values (0-100), States, Animation, Accessibility
- **Key Tests**: Progress values, dynamic updates, aria-valuenow, animation
- **Lines**: ~380
```bash
npm test -- src/components/__tests__/ui/Progress.test.tsx --run
```

### Container Components

#### [Tabs.test.tsx](./Tabs.test.tsx)
- **Tests**: 80
- **Coverage**: Navigation, States (2), Keyboard (arrow keys), Accessibility
- **Key Tests**: Tab switching, active/inactive states, keyboard navigation, form integration
- **Lines**: ~520
```bash
npm test -- src/components/__tests__/ui/Tabs.test.tsx --run
```

## Test Statistics

| Component | Tests | Lines | Variants | States | Interactive |
|-----------|-------|-------|----------|--------|-------------|
| Button | 210+ | 950 | 8 | 5 | Yes |
| Input | 200+ | 850 | 9 | 5 | Yes |
| RadioGroup | 85 | 520 | - | 2 | Yes |
| Switch | 90 | 500 | - | 4 | Yes |
| Tabs | 80 | 520 | - | 2 | Yes |
| Badge | 80 | 480 | 8 | 1 | No |
| Alert | 81 | 520 | 5 | 3 | No |
| Checkbox | 70 | 450 | - | 5 | Yes |
| Spinner | 70 | 420 | 7 | 6 | No |
| Label | 41 | 360 | - | - | No |
| Progress | 42 | 380 | - | 3 | No |
| Card | 39 | 360 | - | - | No |
| **TOTAL** | **530+** | **5,192** | **32** | **36** | **~60%** |

## Running Tests

### All UI Tests
```bash
npm test -- src/components/__tests__/ui/ --run
```

### Single Component
```bash
npm test -- src/components/__tests__/ui/Button.test.tsx --run
```

### Watch Mode
```bash
npm test -- src/components/__tests__/ui/ --watch
```

### With Coverage
```bash
npm test -- src/components/__tests__/ui/ --coverage
```

### Specific Test Category
```bash
# Just rendering tests
npm test -- src/components/__tests__/ui/Button.test.tsx -t "Rendering" --run

# Just accessibility tests
npm test -- src/components/__tests__/ui/Button.test.tsx -t "Accessibility" --run
```

## Test Organization

Each test file is organized into logical describe blocks:

### Common Sections in Most Tests
1. **Rendering** - Basic component rendering
2. **States** - All possible component states
3. **User Interactions** - Click, keyboard, focus events
4. **Attributes** - Props, data attributes, aria attributes
5. **Styling** - CSS classes, variants, responsive
6. **Accessibility** - ARIA, keyboard nav, a11y compliance
7. **Form Integration** - Form submission, data collection
8. **Edge Cases** - Empty content, long text, special chars
9. **Display Names** - Component display name validation

## Test Patterns Used

### Basic Rendering
```typescript
it('should render component', () => {
  render(<Component />);
  expect(screen.getByRole('...')).toBeInTheDocument();
});
```

### User Interactions
```typescript
it('should handle click', async () => {
  const user = userEvent.setup();
  render(<Component />);
  await user.click(screen.getByRole('button'));
  expect(...).toBe(...);
});
```

### Accessibility
```typescript
it('should have no a11y violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Component Features Tested

### Comprehensive Coverage
- ✅ Default props and rendering
- ✅ All component variants and sizes
- ✅ All component states (disabled, loading, error, etc.)
- ✅ User interactions (click, keyboard, form submission)
- ✅ Accessibility (ARIA, keyboard nav, focus management)
- ✅ Edge cases (empty, long text, unicode, rapid actions)
- ✅ Form integration and composition
- ✅ Multiple instances and combinations

## Documentation

- [README.md](../README.md) - Complete testing guide
- [UI_COMPONENT_TESTS_SUMMARY.md](../UI_COMPONENT_TESTS_SUMMARY.md) - Detailed breakdown
- [../TEST_SUITE_COMPLETION_SUMMARY.md](../../TEST_SUITE_COMPLETION_SUMMARY.md) - Executive summary

## Quick Links

### By Use Case
- **Form Development**: Button, Input, Checkbox, RadioGroup, Switch, Label
- **Status Display**: Badge, Alert, Spinner, Progress
- **Layout**: Card, Tabs

### By Test Count
- **210+ tests**: Button
- **200+ tests**: Input
- **90 tests**: Switch
- **85 tests**: RadioGroup
- **81 tests**: Alert
- **80 tests**: Badge, Tabs
- **70 tests**: Checkbox, Spinner
- **42 tests**: Progress
- **41 tests**: Label
- **39 tests**: Card

### By Technology
- **Keyboard Navigation**: Button, Input, Checkbox, RadioGroup, Switch, Tabs
- **Form Submission**: Button, Checkbox, RadioGroup, Switch, Input
- **ARIA Attributes**: All components
- **Accessibility**: All components have accessibility tests
- **Variants**: Button (8), Input (9), Badge (8), Spinner (7), Alert (5)

## Troubleshooting Tests

### Test Won't Run
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install --legacy-peer-deps
npm test
```

### Component Not Found
- Check import path in test file
- Verify component is exported from index

### Assertion Failing
- Use `screen.debug()` to see actual DOM
- Review actual component implementation
- Adjust test expectations if needed

### Accessibility Violations
- Check axe error messages
- Add missing ARIA attributes
- Review semantic HTML usage

## Contributing

When adding new tests:
1. Follow existing file organization
2. Include all test sections (rendering, states, interactions, a11y)
3. Use semantic queries (getByRole preferred)
4. Include accessibility tests
5. Test edge cases and error states
6. Document any special considerations

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/)

---

**Last Updated**: February 2026
**Total Tests**: 530+
**Total Lines**: 5,192
**Pass Rate**: 66%+
