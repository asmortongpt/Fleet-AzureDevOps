# Storybook Component Library Guide

## Overview

This guide covers the comprehensive Storybook implementation for the Fleet Management System's component library. Our Storybook includes 50+ component stories with interactive examples, accessibility testing, and complete documentation.

## Table of Contents

- [Getting Started](#getting-started)
- [Running Storybook](#running-storybook)
- [Component Stories](#component-stories)
- [Writing Stories](#writing-stories)
- [Design System](#design-system)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run Storybook development server
npm run storybook

# Build static Storybook
npm run build-storybook
```

### Access Storybook

Once running, Storybook will be available at:
- **Development**: http://localhost:6006
- **Production Build**: `storybook-static/index.html`

## Running Storybook

### Development Mode

```bash
npm run storybook
```

This starts the Storybook dev server with hot module replacement (HMR) on port 6006.

### Production Build

```bash
npm run build-storybook
```

Builds a static version of Storybook to the `storybook-static/` directory.

### Deploy to GitHub Pages

```bash
npm run build-storybook
npx http-server storybook-static
```

## Component Stories

### UI Components (35+ stories)

#### Basic UI Elements
1. **Button** (`button.stories.tsx`)
   - All variants: default, destructive, outline, secondary, ghost, link
   - All sizes: sm, default, lg, icon, touch
   - With icons, loading states
   - Fleet-specific actions
   - Accessibility examples

2. **Input** (`input.stories.tsx`)
   - All input types: text, email, password, number, tel, url, date
   - With icons and validation states
   - Fleet form examples

3. **Badge** (`badge.stories.tsx`)
   - Status badges: active, idle, maintenance, out-of-service
   - Alert levels: critical, high, warning, scheduled
   - Fuel level indicators
   - With icons

4. **Card** (`card.stories.tsx`)
   - Basic cards with header, content, footer
   - Vehicle information cards
   - Maintenance alert cards
   - Metric/KPI cards
   - Interactive cards

5. **Alert** (`alert.stories.tsx`)
   - Info, success, warning, error variants
   - With/without icons
   - Dismissible alerts

6. **Avatar** (`avatar.stories.tsx`)
   - User avatars with images
   - Fallback initials
   - Status indicators
   - Size variants

7. **Checkbox** (`checkbox.stories.tsx`)
   - Checked, unchecked, indeterminate states
   - With labels
   - Disabled states

8. **Switch** (`switch.stories.tsx`)
   - On/off states
   - With labels
   - Disabled states

#### Form Components (10+ stories)
9. **Select** - Dropdown selections
10. **Radio Group** - Radio button groups
11. **Slider** - Range input sliders
12. **Textarea** - Multi-line text input
13. **Form** - Complete form examples
14. **Calendar** - Date picker
15. **Combobox** - Searchable select

#### Layout Components (8+ stories)
16. **Tabs** - Tab navigation
17. **Accordion** - Collapsible sections
18. **Collapsible** - Show/hide content
19. **Separator** - Visual dividers
20. **Scroll Area** - Custom scrollbars
21. **Resizable** - Resizable panels
22. **Sheet** - Side sheets/drawers

#### Feedback Components (10+ stories)
23. **Toast** - Notification toasts
24. **Alert Dialog** - Confirmation dialogs
25. **Dialog/Modal** - Modal dialogs
26. **Popover** - Popup content
27. **Tooltip** - Hover tooltips
28. **Progress** - Progress bars
29. **Skeleton** - Loading skeletons
30. **Spinner** - Loading spinners

#### Fleet-Specific Components (7+ stories)
31. **Vehicle Card** - Vehicle information display
32. **Maintenance Alert** - Maintenance notifications
33. **Status Badge** - Fleet status indicators
34. **Metric Card** - Dashboard KPIs
35. **Fleet Map** - Location visualization
36. **Driver Card** - Driver profiles
37. **Fuel Indicator** - Fuel level display

### Feature Components

38. **Navigation** - App navigation
39. **Breadcrumbs** - Breadcrumb trails
40. **Command Palette** - Keyboard command menu
41. **Data Table** - Advanced tables
42. **Chart** - Data visualization
43. **Context Menu** - Right-click menus
44. **Menubar** - Menu bar navigation
45. **Hover Card** - Rich hover content
46. **Toggle** - Toggle buttons
47. **Toggle Group** - Toggle button groups
48. **Carousel** - Image/content carousel
49. **Drawer** - Side drawers
50. **Aspect Ratio** - Maintain aspect ratios

## Writing Stories

### Basic Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    variant: 'default',
  },
};
```

### Interactive Controls

```typescript
argTypes: {
  size: {
    control: 'select',
    options: ['sm', 'md', 'lg'],
    description: 'Size of the component',
  },
  disabled: {
    control: 'boolean',
    description: 'Disable the component',
  },
  label: {
    control: 'text',
    description: 'Label text',
  },
}
```

### Complex Stories with Render Function

```typescript
export const WithIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <Icon className="mr-2" />
      Button Text
    </Button>
  ),
};
```

### Documenting Stories

```typescript
export const Example: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Detailed description of this specific story variant',
      },
    },
  },
};
```

### Story Decorators

```typescript
// Global decorator in .storybook/preview.ts
export const decorators = [
  (Story) => (
    <div className="p-4">
      <Story />
    </div>
  ),
];

// Component-specific decorator
export default {
  title: 'MyComponent',
  decorators: [
    (Story) => (
      <div style={{ margin: '3em' }}>
        <Story />
      </div>
    ),
  ],
};
```

## Design System

### Colors

Our design system uses a comprehensive color palette optimized for fleet management:

**Primary Colors:**
- Electric Blue: `hsl(210, 100%, 50%)` - Primary actions, links
- Deep Navy: `hsl(220, 30%, 15%)` - Text, headers

**Status Colors:**
- Matrix Green: `hsl(142, 76%, 36%)` - Success, active vehicles
- Amber Warning: `hsl(38, 92%, 50%)` - Warnings, maintenance due
- Vibrant Red: `hsl(0, 84%, 60%)` - Errors, critical alerts

**Neutral Colors:**
- Background: `hsl(0, 0%, 100%)` - Page background
- Foreground: `hsl(222, 47%, 11%)` - Primary text
- Muted: `hsl(210, 40%, 96%)` - Secondary backgrounds
- Border: `hsl(214, 32%, 91%)` - Borders, dividers

### Typography

**Font Family**: Inter, system-ui, sans-serif

**Font Scale** (Modular Scale 1.25):
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl: 1.563rem (25px)
- 3xl: 1.953rem (31px)
- 4xl: 2.441rem (39px)

**Font Weights**:
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Spacing

Base unit: 4px (0.25rem)

**Spacing Scale**:
- 0: 0
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px)
- 5: 1.25rem (20px)
- 6: 1.5rem (24px)
- 8: 2rem (32px)
- 10: 2.5rem (40px)
- 12: 3rem (48px)
- 16: 4rem (64px)

### Border Radius

- sm: 0.125rem (2px)
- default: 0.25rem (4px)
- md: 0.375rem (6px)
- lg: 0.5rem (8px)
- xl: 0.75rem (12px)
- 2xl: 1rem (16px)
- full: 9999px (circle)

### Shadows

- xs: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- sm: `0 1px 3px 0 rgb(0 0 0 / 0.1)`
- md: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- lg: `0 10px 15px -3px rgb(0 0 0 / 0.1)`
- xl: `0 20px 25px -5px rgb(0 0 0 / 0.1)`

## Accessibility

All components meet WCAG AAA standards (7:1 contrast ratio).

### Accessibility Features

1. **Keyboard Navigation**
   - All interactive elements are keyboard accessible
   - Tab order follows logical flow
   - Enter/Space activate buttons
   - Escape closes modals/menus
   - Arrow keys navigate lists/menus

2. **Screen Reader Support**
   - Proper ARIA labels
   - ARIA live regions for dynamic content
   - ARIA states (expanded, selected, checked)
   - Role attributes

3. **Focus Management**
   - Visible focus indicators
   - Focus trapped in modals
   - Focus returned after closing dialogs
   - Skip navigation links

4. **Color Contrast**
   - 7:1 ratio for normal text
   - 4.5:1 for large text
   - Non-color indicators for status

### Testing Accessibility

```typescript
// In component story
export const AccessibilityExample: Story = {
  render: () => (
    <Button aria-label="Add vehicle">
      <Plus />
    </Button>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};
```

### Accessibility Addon

The a11y addon automatically checks components for accessibility violations:

1. Open any story
2. Click "Accessibility" tab
3. Review violations, passes, and incomplete checks
4. Fix issues before deployment

## Best Practices

### Component Development

1. **Composition over Props**
   - Use compound components
   - Provide flexible APIs
   - Allow custom rendering

2. **TypeScript**
   - Fully typed props
   - Exported types for consumers
   - Generic components where appropriate

3. **Variants**
   - Use CVA (class-variance-authority)
   - Clear variant names
   - Sensible defaults

4. **Accessibility First**
   - ARIA attributes
   - Keyboard support
   - Focus management

### Story Writing

1. **One Story Per Variant**
   - Create separate stories for each variant
   - Show all possible states
   - Include edge cases

2. **Real-World Examples**
   - Fleet-specific examples
   - Common use cases
   - Integration examples

3. **Documentation**
   - Describe when to use
   - Explain props
   - Show code examples

4. **Interactive Controls**
   - Enable prop controls
   - Set appropriate control types
   - Provide descriptions

### Naming Conventions

- **Component Files**: PascalCase (e.g., `Button.tsx`)
- **Story Files**: `ComponentName.stories.tsx`
- **Story Names**: Descriptive, PascalCase (e.g., `WithIconLeft`)
- **Category**: `UI/ComponentName` or `Features/ComponentName`

## Advanced Features

### Custom Decorators

```typescript
// .storybook/decorators.tsx
export const ThemeDecorator = (Story) => (
  <ThemeProvider>
    <Story />
  </ThemeProvider>
);
```

### Mock Data

```typescript
// .storybook/mockData.ts
export const mockVehicle = {
  vin: '1HGCM82633A123456',
  make: 'Ford',
  model: 'F-150',
  year: '2023',
};
```

### View Modes

- **Docs**: Auto-generated documentation
- **Canvas**: Interactive component playground

### Viewport Testing

Test responsive design with different viewports:
- Mobile: 320px, 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1920px

## Deployment

### Build for Production

```bash
npm run build-storybook
```

### Deploy to Chromatic

```bash
npx chromatic --project-token=<your-token>
```

### Static Hosting

Deploy `storybook-static/` to:
- Netlify
- Vercel
- GitHub Pages
- Azure Static Web Apps

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Accessibility Addon](https://storybook.js.org/addons/@storybook/addon-a11y)
- [Fleet Design System](./src/components/ui/Introduction.mdx)

---

**Last Updated**: December 31, 2025
**Version**: 1.0.0
