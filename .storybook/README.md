# Storybook Documentation Setup

This directory contains the Storybook configuration and documentation for the Fleet Management System map components.

## Structure

```
.storybook/
├── main.ts              # Storybook configuration
├── preview.ts           # Global settings and decorators
├── decorators.tsx       # Custom decorators for stories
├── mockData.ts          # Mock data generators
├── Introduction.mdx     # Welcome documentation
└── README.md            # This file
```

## Files Overview

### `main.ts`
Main Storybook configuration:
- Story file patterns
- Addon configuration
- Vite customization
- Path aliases

### `preview.ts`
Global preview settings:
- Default parameters
- Global decorators
- Viewport configurations
- Theme settings

### `decorators.tsx`
Custom decorators for stories:
- `withRouter` - React Router support
- `withTheme` - Dark/light theme switching
- `withFullPage` - Full-page layout
- `withMapContainer` - Map sizing wrapper

### `mockData.ts`
Mock data generators:
- `generateMockVehicles(count)` - Generate vehicle data
- `generateMockFacilities(count)` - Generate facility data
- `generateMockCameras(count)` - Generate camera data
- `generateLargeVehicleDataset(count)` - Large datasets for testing
- Helper functions for filtering data

## Running Storybook

```bash
# Development mode (hot reload)
npm run storybook

# Build static site
npm run build-storybook

# The built files will be in storybook-static/
```

## Adding New Stories

### 1. Create a Story File

Create a `.stories.tsx` file next to your component:

```tsx
// src/components/MyComponent.stories.tsx
import type { Meta, StoryObj } from "@storybook/react"
import { MyComponent } from "./MyComponent"

const meta = {
  title: "Components/MyComponent",
  component: MyComponent,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    myProp: {
      description: "Description of myProp",
      control: { type: "text" },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MyComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    myProp: "value",
  },
}
```

### 2. Using Decorators

Apply decorators to stories that need them:

```tsx
import { withMapContainer, withRouter } from "../../../.storybook/decorators"

const meta = {
  title: "Maps/MyMap",
  component: MyMap,
  decorators: [withMapContainer], // Apply decorator
  // ...
} satisfies Meta<typeof MyMap>
```

### 3. Using Mock Data

Import and use mock data generators:

```tsx
import { generateMockVehicles } from "../../../.storybook/mockData"

export const Default: Story = {
  args: {
    vehicles: generateMockVehicles(10),
  },
}
```

## Story Organization

Stories are organized by category:

- **Maps/** - Map components (UniversalMap, LeafletMap, GoogleMap)
- **Pages/** - Full-page components (GPSTracking, FleetDashboard, etc.)
- **Components/** - UI components (buttons, cards, etc.)
- **Forms/** - Form components

## Best Practices

### Documentation

Always include:
- Component description
- Props documentation with argTypes
- Usage examples
- Multiple story variants
- Edge cases (empty, loading, error states)

```tsx
const meta = {
  title: "Components/MyComponent",
  component: MyComponent,
  parameters: {
    docs: {
      description: {
        component: `
# MyComponent

A comprehensive description of what this component does and how to use it.

## Features
- Feature 1
- Feature 2

## Usage
\`\`\`tsx
<MyComponent prop="value" />
\`\`\`
        `,
      },
    },
  },
  // ...
}
```

### Story Variants

Create multiple stories showcasing different states:

```tsx
export const Default: Story = { ... }
export const Loading: Story = { ... }
export const Error: Story = { ... }
export const Empty: Story = { ... }
export const LargeDataset: Story = { ... }
```

### Interactive Controls

Define argTypes for interactive controls:

```tsx
argTypes: {
  size: {
    control: { type: "select" },
    options: ["small", "medium", "large"],
  },
  count: {
    control: { type: "range", min: 0, max: 100, step: 1 },
  },
  enabled: {
    control: { type: "boolean" },
  },
}
```

## Addons

### Included Addons

- **@storybook/addon-links** - Link between stories
- **@storybook/addon-essentials** - Core addons bundle
  - Actions
  - Backgrounds
  - Controls
  - Docs
  - Viewport
  - Toolbars
- **@storybook/addon-interactions** - Component testing
- **@storybook/addon-a11y** - Accessibility testing

### Using the A11y Addon

The a11y addon automatically checks stories for accessibility issues:

1. Open any story
2. Click the "Accessibility" tab
3. Review any violations
4. Fix issues in the component

## Environment Variables

Storybook has access to environment variables:

```tsx
// In your stories
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
```

Variables are configured in `.storybook/main.ts`:

```ts
async viteFinal(config) {
  return {
    ...config,
    define: {
      ...config.define,
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(
        process.env.VITE_GOOGLE_MAPS_API_KEY || ""
      ),
    },
  }
}
```

## Troubleshooting

### Stories not appearing

1. Check file is named `*.stories.tsx`
2. Verify it's in `src/` directory
3. Restart Storybook

### Decorator not working

1. Verify decorator is exported from `decorators.tsx`
2. Check import path is correct
3. Apply decorator in `meta` object, not individual stories

### Mock data issues

1. Import from correct path: `../../../.storybook/mockData`
2. Verify function signature matches usage
3. Check data types match component props

### Map not displaying

1. Verify `withMapContainer` decorator is applied
2. Check map component has proper height/width
3. For Google Maps, verify API key is set

## Testing Stories

### Manual Testing Checklist

For each story:
- [ ] Renders without errors
- [ ] All controls work as expected
- [ ] Responsive at different viewports
- [ ] No console errors or warnings
- [ ] Accessibility tab shows no violations
- [ ] Dark mode (if applicable) works
- [ ] Loading states work
- [ ] Error states work

### Automated Testing

Stories can be tested with:
- Playwright component tests
- Jest with Storybook testing library
- Chromatic for visual regression

## Deployment

Build and deploy Storybook as static site:

```bash
# Build
npm run build-storybook

# Deploy to any static hosting
# - GitHub Pages
# - Netlify
# - Vercel
# - AWS S3
```

The built files will be in `storybook-static/` directory.

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Component Story Format](https://storybook.js.org/docs/api/csf)
- [Vite Builder](https://storybook.js.org/docs/builders/vite)
- [Addons](https://storybook.js.org/addons)

## Support

For questions or issues:
1. Check existing stories for examples
2. Review Storybook documentation
3. Check component implementation
4. Consult team documentation
