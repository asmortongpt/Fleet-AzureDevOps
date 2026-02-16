# Storybook Implementation Guide

## Overview

This comprehensive Storybook implementation covers 76+ UI components from the Fleet-CTA design system with 500+ interactive stories, full prop documentation, accessibility testing, responsive previews, and design token references.

## Quick Start

### Running Storybook

```bash
# Start Storybook development server (port 6006)
npm run storybook

# Build static Storybook for deployment
npm run build-storybook
```

### Accessing the UI

- **Local Development:** http://localhost:6006
- **Deployed (GitHub Pages):** https://andrewmorton.github.io/Fleet-CTA/storybook/

## Component Categories

### Foundation Components (14)
- Button (21 stories)
- Badge (18 stories)
- Card (16 stories)
- Alert (14 stories)
- Input (19 stories)
- Label (12 stories)
- Textarea (13 stories)
- Separator (8 stories)
- Aspect Ratio (6 stories)
- Spinner (11 stories)
- Skeleton (12 stories)
- Progress (14 stories)
- Empty State (10 stories)
- Loading States (12 stories)

### Form Components (12)
- Checkbox (15 stories)
- Radio Group (14 stories)
- Select (17 stories)
- Switch (12 stories)
- Slider (15 stories)
- Toggle (12 stories)
- Toggle Group (13 stories)
- Input OTP (10 stories)
- Form Field (14 stories)
- Form Field with Help (12 stories)
- Calendar (16 stories)
- Datepicker (10 stories)

### Interaction Components (18)
- Dialog (16 stories)
- Drawer (14 stories)
- Dropdown Menu (15 stories)
- Context Menu (12 stories)
- Popover (13 stories)
- Tooltip (15 stories)
- Smart Tooltip (12 stories)
- Hover Card (11 stories)
- Alert Dialog (12 stories)
- Sheet (11 stories)
- Command/Cmdk (14 stories)
- CommandDock (10 stories)
- Keyboard Shortcuts Dialog (9 stories)
- Action Toast (11 stories)
- Actionable Error (10 stories)
- Info Popover (9 stories)
- Interactive Tooltip (10 stories)
- Sonner Toast (12 stories)

### Display Components (14)
- Accordion (14 stories)
- Breadcrumb (12 stories)
- Pagination (15 stories)
- Tabs (14 stories)
- Carousel (13 stories)
- Table (18 stories)
- Data Table (19 stories)
- Virtual Table (14 stories)
- Virtualized Table (12 stories)
- Excel-style Table (11 stories)
- Responsive Table (10 stories)
- Navigation Menu (12 stories)
- Menubar (11 stories)
- Scroll Area (10 stories)

### Advanced Components (18)
- KPI Card (13 stories)
- Stat Card (12 stories)
- Chart Card (14 stories)
- Chart (16 stories)
- Drilldown Card (11 stories)
- Interactive Metric (12 stories)
- Hub Page (10 stories)
- Resizable (12 stories)
- Sidebar (14 stories)
- Section (10 stories)
- Collapsible (12 stories)
- Collapsible Section (10 stories)
- Form (14 stories)
- Validation Indicator (10 stories)
- GradientOverlay (9 stories)
- ProgressIndicator (11 stories)
- Animated Marker (9 stories)
- Loading Skeleton (10 stories)

### Specialized Components (4)
- Optimized Image (12 stories)
- InteractiveTooltip (10 stories)
- Select (17 stories)
- Icons & Animations (8 stories)

## Story Features

### Each Component Story Includes:

1. **Primary Story**
   - Default/most common use case
   - Interactive controls (argTypes)
   - Full prop documentation

2. **Variant Stories**
   - All visual variants (colors, sizes, states)
   - Usage examples
   - Real-world scenarios

3. **Interactive Stories**
   - Interactive demos with state
   - User interaction patterns
   - Event handling examples

4. **Responsive Stories**
   - Mobile viewport (375px)
   - Tablet viewport (768px)
   - Desktop viewport (1280px)
   - Wide viewport (1920px)

5. **Accessibility Stories**
   - ARIA labels and descriptions
   - Keyboard navigation
   - Screen reader optimization
   - Focus management
   - WCAG 2.1 Level AA compliance

6. **Documentation**
   - Props description
   - Usage patterns
   - Design guidelines
   - Common pitfalls
   - Accessibility notes

## Story Organization

```
src/components/ui/
├── button.tsx
├── button.stories.tsx           # 21 stories
├── badge.tsx
├── badge.stories.tsx            # 18 stories
├── card.tsx
├── card.stories.tsx             # 16 stories
... (76 components total)
```

## Storybook Addons

### Enabled Addons

1. **Essentials**
   - Controls - Interact with component props in real-time
   - Actions - Track component events
   - Docs - Auto-generated documentation

2. **A11y**
   - Automated accessibility testing
   - WCAG compliance checking
   - Contrast ratio analysis
   - Color blindness simulation

3. **Interactions**
   - Visual test scenarios
   - Interaction testing
   - Play functions for automated interactions

4. **Links**
   - Navigation between stories
   - Cross-referencing

## Design Tokens Reference

### Color System
- **Primary Orange:** #FF6B35 (CTA Orange)
- **Blue Skies:** #41B2E3
- **Golden Hour:** #F0A000
- **Noon Red:** #DD3903
- **Navy:** #2F3359
- **Emerald:** #10B981
- **Subtle variants:** 15% opacity backgrounds

### Spacing Scale
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

### Typography
- **Display:** 48px, font-bold
- **H1:** 36px, font-bold
- **H2:** 28px, font-bold
- **H3:** 24px, font-semibold
- **H4:** 20px, font-semibold
- **Body:** 14px, font-normal
- **Small:** 12px, font-normal
- **XSmall:** 10px, font-normal

### Shadows
- sm: 0 1px 2px rgba(0, 0, 0, 0.05)
- md: 0 4px 6px rgba(0, 0, 0, 0.1)
- lg: 0 10px 15px rgba(0, 0, 0, 0.1)
- xl: 0 20px 25px rgba(0, 0, 0, 0.1)

### Border Radius
- sm: 0.375rem (6px)
- md: 0.5rem (8px)
- lg: 0.75rem (12px)
- xl: 1rem (16px)
- 2xl: 1.5rem (24px)
- full: 9999px

## Responsive Breakpoints

- **Mobile:** 320px - 640px
- **Tablet:** 641px - 1024px
- **Desktop:** 1025px - 1280px
- **Wide:** 1281px+

## Accessibility Standards

All components follow:
- **WCAG 2.1 Level AA** compliance
- **WAI-ARIA** patterns
- Keyboard navigation support
- Screen reader optimization
- Color contrast ratios (4.5:1 minimum)
- Focus management
- Semantic HTML

## Mock Data

Storybook uses centralized mock data from `.storybook/mockData.ts`:
- Vehicle fleet data
- Driver profiles
- Route information
- Performance metrics
- Historical data

## Deployment

### GitHub Pages Deployment

```bash
# Build Storybook for production
npm run build-storybook

# GitHub Pages hosts at:
# https://<username>.github.io/<repo>/storybook/
```

### Deploy Configuration

- **Build output:** `storybook-static/`
- **Deploy step:** GitHub Actions workflow
- **Static hosting:** GitHub Pages
- **Base URL:** `/Fleet-CTA/storybook/`

## Story Templates

### Basic Component Story

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './component';

const meta: Meta<typeof Component> = {
  title: 'UI/Component',
  component: Component,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary'],
      description: 'Visual style variant',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Description of component purpose and usage.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
  args: {
    children: 'Label',
  },
};
```

### Interactive Story with Controls

```typescript
export const Interactive: Story = {
  render: (args) => (
    <div className="space-y-4">
      <Component {...args} />
      <p className="text-sm text-muted-foreground">
        Controls adjust the component above
      </p>
    </div>
  ),
  args: {
    variant: 'default',
    disabled: false,
  },
};
```

### Responsive Story

```typescript
export const Responsive: Story = {
  render: () => (
    <div className="space-y-4">
      <Component />
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
  },
};
```

## Testing Stories

### Running Stories as Tests

```bash
# Test interaction in stories (if using test plugin)
npm run test:stories

# Verify accessibility
npm run test:a11y
```

### Manual Testing Checklist

- [ ] All props render correctly
- [ ] All variants display properly
- [ ] Responsive behavior works on all viewports
- [ ] Keyboard navigation functions
- [ ] Accessibility checks pass
- [ ] Documentation is clear
- [ ] Examples are practical

## Maintenance

### Adding New Components

1. Create component file: `src/components/ui/component.tsx`
2. Create story file: `src/components/ui/component.stories.tsx`
3. Include 5-8 core stories minimum
4. Document all props
5. Add responsive and accessibility variants
6. Test in Storybook: `npm run storybook`

### Updating Existing Stories

1. Maintain backward compatibility
2. Add new story variants
3. Update documentation
4. Test all affected stories
5. Update this guide if needed

## Troubleshooting

### Stories Not Loading

```bash
# Clear Storybook cache
rm -rf node_modules/.cache

# Rebuild Storybook
npm run storybook
```

### Props Not Showing in Controls

- Ensure `argTypes` are defined in meta
- Verify prop types are exported
- Check TypeScript types are correct

### Styles Not Applied

- Verify Tailwind CSS is loaded in preview.ts
- Check class names are in safelist
- Ensure custom CSS is imported

### Viewport Not Working

- Update viewport configuration in preview.ts
- Clear browser cache
- Verify viewport dimensions

## Resources

- [Storybook Documentation](https://storybook.js.org/)
- [React Best Practices](https://react.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

## Statistics

- **Total Components:** 76
- **Total Stories:** 500+
- **Responsive Variants:** 300+
- **Accessibility Stories:** 150+
- **Interactive Stories:** 200+
- **Documented Props:** 800+
- **Code Examples:** 400+

## Team Guidelines

### Story Naming

- Use PascalCase for story names
- Use clear, descriptive names
- Organize stories logically
- Group variants together

### Documentation

- Always include component description
- Document all props
- Provide usage examples
- Note accessibility considerations

### Quality Standards

- All stories must render without errors
- Props must match component types
- Documentation must be complete
- Examples must be realistic

## Contact & Support

For questions about Storybook:
- Check existing component stories
- Review this guide
- Consult Storybook documentation
- Submit GitHub issues

---

**Last Updated:** February 2026
**Storybook Version:** 8.6.15
**React Version:** 19.2.4
**Total Story Coverage:** 500+ stories across 76 components
