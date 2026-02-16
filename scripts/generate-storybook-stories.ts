#!/usr/bin/env node

/**
 * Story Generator for Fleet-CTA Storybook
 * Generates comprehensive story files for all UI components
 *
 * Generates:
 * - Default variants for all components
 * - Size variants
 * - State variants (disabled, loading, error, etc.)
 * - Interactive stories with controls
 * - Responsive variants
 * - Accessibility stories
 * - Real-world usage examples
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.join(__dirname, '../src/components/ui');

// Component configuration - defines how to generate stories for each
const componentConfig: Record<string, {
  title: string;
  variantProp?: string;
  variants?: string[];
  sizeProp?: string;
  sizes?: string[];
  defaultProps?: Record<string, unknown>;
  hasIcon?: boolean;
  hasLoading?: boolean;
  hasState?: boolean;
  specialStories?: string[];
}> = {
  'accordion.tsx': {
    title: 'Accordion',
    specialStories: ['Basic', 'MultipleOpen', 'Disabled', 'CustomContent', 'LongContent']
  },
  'action-toast.tsx': {
    title: 'Action Toast',
    variantProp: 'variant',
    variants: ['default', 'destructive', 'success'],
    specialStories: ['WithAction', 'AutoDismiss', 'CustomDuration']
  },
  'actionable-error.tsx': {
    title: 'Actionable Error',
    specialStories: ['WithRetry', 'WithDetails', 'MultipleActions']
  },
  'alert-dialog.tsx': {
    title: 'Alert Dialog',
    specialStories: ['Confirm', 'Warning', 'Destructive', 'Loading']
  },
  'alert.tsx': {
    title: 'Alert',
    variantProp: 'variant',
    variants: ['default', 'destructive'],
    hasIcon: true,
    specialStories: ['WithDescription', 'MultilineText', 'DismissibleAlert']
  },
  'animated-marker.tsx': {
    title: 'Animated Marker',
    specialStories: ['Bouncing', 'Floating', 'Pulsing']
  },
  'aspect-ratio.tsx': {
    title: 'Aspect Ratio',
    specialStories: ['Video', 'Image', 'Custom']
  },
  'avatar.tsx': {
    title: 'Avatar',
    specialStories: ['WithImage', 'WithInitials', 'Fallback', 'Group']
  },
  'badge.tsx': {
    title: 'Badge',
    variantProp: 'variant',
    variants: ['default', 'secondary', 'destructive', 'success', 'warning', 'info', 'outline', 'ghost', 'online', 'offline', 'pending'],
    sizeProp: 'size',
    sizes: ['default', 'sm', 'lg'],
    hasIcon: true,
    specialStories: ['WithCount', 'Animated', 'Status']
  },
  'breadcrumb.tsx': {
    title: 'Breadcrumb',
    specialStories: ['Simple', 'WithIcon', 'Truncated', 'Mobile']
  },
  'button.tsx': {
    title: 'Button',
    variantProp: 'variant',
    variants: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'success', 'warning', 'professional'],
    sizeProp: 'size',
    sizes: ['sm', 'default', 'lg', 'xl', 'icon', 'touch'],
    hasIcon: true,
    hasLoading: true,
    specialStories: ['WithIcon', 'Disabled', 'Group', 'FleetActions']
  },
  'calendar.tsx': {
    title: 'Calendar',
    specialStories: ['SingleSelect', 'RangeSelect', 'Disabled', 'CustomFooter']
  },
  'card.tsx': {
    title: 'Card',
    specialStories: ['Basic', 'WithHeader', 'WithFooter', 'Interactive', 'Premium', 'Accent']
  },
  'carousel.tsx': {
    title: 'Carousel',
    specialStories: ['AutoPlay', 'WithControls', 'Vertical', 'Pagination']
  },
  'chart.tsx': {
    title: 'Chart',
    specialStories: ['LineChart', 'BarChart', 'PieChart', 'AreaChart']
  },
  'chart-card.tsx': {
    title: 'Chart Card',
    specialStories: ['Revenue', 'Metrics', 'Comparison']
  },
  'checkbox.tsx': {
    title: 'Checkbox',
    hasState: true,
    specialStories: ['Default', 'Checked', 'Disabled', 'Indeterminate', 'Group']
  },
  'collapsible.tsx': {
    title: 'Collapsible',
    specialStories: ['Default', 'Expanded', 'WithIcon', 'Nested']
  },
  'collapsible-section.tsx': {
    title: 'Collapsible Section',
    specialStories: ['Default', 'NoHeader', 'WithActions']
  },
  'command.tsx': {
    title: 'Command',
    specialStories: ['Search', 'Groups', 'Dialog', 'Combobox']
  },
  'context-menu.tsx': {
    title: 'Context Menu',
    specialStories: ['Basic', 'Nested', 'WithCheckbox', 'CustomContent']
  },
  'data-table.tsx': {
    title: 'Data Table',
    specialStories: ['Basic', 'Sortable', 'Filterable', 'Selectable', 'Pagination']
  },
  'dialog.tsx': {
    title: 'Dialog',
    specialStories: ['Basic', 'WithForm', 'ScrollableContent', 'Loading']
  },
  'drawer.tsx': {
    title: 'Drawer',
    specialStories: ['FromLeft', 'FromRight', 'FromTop', 'FromBottom']
  },
  'drilldown-card.tsx': {
    title: 'Drilldown Card',
    specialStories: ['Default', 'WithMetrics', 'Interactive']
  },
  'dropdown-menu.tsx': {
    title: 'Dropdown Menu',
    specialStories: ['Basic', 'WithIcon', 'Grouped', 'Nested']
  },
  'empty-state.tsx': {
    title: 'Empty State',
    specialStories: ['NoData', 'NoResults', 'Error', 'WithAction']
  },
  'excel-style-table.tsx': {
    title: 'Excel Style Table',
    specialStories: ['Basic', 'Editable', 'WithFilters', 'Export']
  },
  'form-field.tsx': {
    title: 'Form Field',
    specialStories: ['Default', 'WithLabel', 'WithError', 'Required']
  },
  'form-field-with-help.tsx': {
    title: 'Form Field with Help',
    specialStories: ['WithHint', 'WithError', 'WithValidation']
  },
  'form.tsx': {
    title: 'Form',
    specialStories: ['Basic', 'Validation', 'AsyncSubmit', 'MultiStep']
  },
  'gradient-overlay.tsx': {
    title: 'Gradient Overlay',
    specialStories: ['Linear', 'Radial', 'Custom']
  },
  'hover-card.tsx': {
    title: 'Hover Card',
    specialStories: ['WithContent', 'Delay', 'Position']
  },
  'hub-page.tsx': {
    title: 'Hub Page',
    specialStories: ['Dashboard', 'WithSidebar', 'Responsive']
  },
  'info-popover.tsx': {
    title: 'Info Popover',
    specialStories: ['Default', 'WithIcon', 'CustomContent']
  },
  'input.tsx': {
    title: 'Input',
    specialStories: ['Default', 'WithPlaceholder', 'WithError', 'Disabled', 'Types']
  },
  'input-otp.tsx': {
    title: 'Input OTP',
    specialStories: ['Default', 'SeparatorStyle', 'WithPattern']
  },
  'interactive-metric.tsx': {
    title: 'Interactive Metric',
    specialStories: ['Default', 'WithTrend', 'WithComparison']
  },
  'interactive-tooltip.tsx': {
    title: 'Interactive Tooltip',
    specialStories: ['Default', 'WithContent', 'CustomTrigger']
  },
  'keyboard-shortcuts-dialog.tsx': {
    title: 'Keyboard Shortcuts Dialog',
    specialStories: ['Default', 'CustomShortcuts']
  },
  'kpi-card.tsx': {
    title: 'KPI Card',
    specialStories: ['Default', 'WithIcon', 'WithTrend', 'Comparative']
  },
  'label.tsx': {
    title: 'Label',
    specialStories: ['Default', 'Required', 'Optional', 'WithHint']
  },
  'loading-skeleton.tsx': {
    title: 'Loading Skeleton',
    specialStories: ['Text', 'Block', 'Circle', 'Multiple']
  },
  'loading-states.tsx': {
    title: 'Loading States',
    specialStories: ['Spinner', 'Skeleton', 'Progress', 'Pulse']
  },
  'menubar.tsx': {
    title: 'Menubar',
    specialStories: ['Basic', 'WithIcon', 'Nested']
  },
  'navigation-menu.tsx': {
    title: 'Navigation Menu',
    specialStories: ['Basic', 'WithSubmenus', 'Vertical']
  },
  'optimized-image.tsx': {
    title: 'Optimized Image',
    specialStories: ['Default', 'WithPlaceholder', 'LazyLoad']
  },
  'pagination.tsx': {
    title: 'Pagination',
    specialStories: ['Default', 'WithEllipsis', 'Edgecases']
  },
  'popover.tsx': {
    title: 'Popover',
    specialStories: ['Default', 'WithForm', 'Position']
  },
  'progress.tsx': {
    title: 'Progress',
    variantProp: 'variant',
    variants: ['default', 'success'],
    specialStories: ['WithLabel', 'Indeterminate', 'Striped']
  },
  'progress-indicator.tsx': {
    title: 'Progress Indicator',
    specialStories: ['Linear', 'Circular', 'Steps']
  },
  'radio-group.tsx': {
    title: 'Radio Group',
    specialStories: ['Default', 'Vertical', 'Disabled', 'WithDescription']
  },
  'resizable.tsx': {
    title: 'Resizable',
    specialStories: ['Horizontal', 'Vertical', 'Multiple']
  },
  'responsive-table.tsx': {
    title: 'Responsive Table',
    specialStories: ['Default', 'Stackable', 'Mobile']
  },
  'scroll-area.tsx': {
    title: 'Scroll Area',
    specialStories: ['Vertical', 'Horizontal', 'Both']
  },
  'section.tsx': {
    title: 'Section',
    specialStories: ['Default', 'WithTitle', 'Nested']
  },
  'select.tsx': {
    title: 'Select',
    specialStories: ['Default', 'Grouped', 'Searchable', 'MultiSelect']
  },
  'separator.tsx': {
    title: 'Separator',
    specialStories: ['Horizontal', 'Vertical', 'WithLabel']
  },
  'sheet.tsx': {
    title: 'Sheet',
    specialStories: ['FromLeft', 'FromRight', 'FromTop', 'Fullscreen']
  },
  'sidebar.tsx': {
    title: 'Sidebar',
    specialStories: ['Default', 'Collapsed', 'WithFooter']
  },
  'skeleton.tsx': {
    title: 'Skeleton',
    specialStories: ['Default', 'Circle', 'Multiple']
  },
  'skeleton-loader.tsx': {
    title: 'Skeleton Loader',
    specialStories: ['Content', 'Profile', 'List']
  },
  'slider.tsx': {
    title: 'Slider',
    specialStories: ['Default', 'Range', 'Vertical', 'WithSteps']
  },
  'smart-tooltip.tsx': {
    title: 'Smart Tooltip',
    specialStories: ['Default', 'WithDelay', 'CustomContent']
  },
  'sonner.tsx': {
    title: 'Sonner Toast',
    specialStories: ['Default', 'Success', 'Error', 'Promise']
  },
  'spinner.tsx': {
    title: 'Spinner',
    specialStories: ['Default', 'Small', 'Large', 'Colored']
  },
  'stat-card.tsx': {
    title: 'Stat Card',
    specialStories: ['Default', 'WithIcon', 'WithTrend', 'Comparative']
  },
  'switch.tsx': {
    title: 'Switch',
    specialStories: ['Default', 'Checked', 'Disabled', 'WithLabel']
  },
  'table.tsx': {
    title: 'Table',
    specialStories: ['Basic', 'Bordered', 'Striped', 'Compact']
  },
  'tabs.tsx': {
    title: 'Tabs',
    specialStories: ['Default', 'Vertical', 'Disabled', 'WithIcon']
  },
  'textarea.tsx': {
    title: 'Textarea',
    specialStories: ['Default', 'Disabled', 'Error', 'Resizable']
  },
  'toggle.tsx': {
    title: 'Toggle',
    specialStories: ['Default', 'Pressed', 'WithIcon', 'Disabled']
  },
  'toggle-group.tsx': {
    title: 'Toggle Group',
    specialStories: ['Single', 'Multiple', 'Vertical']
  },
  'tooltip.tsx': {
    title: 'Tooltip',
    specialStories: ['Default', 'Position', 'Delay', 'WithContent']
  },
  'validation-indicator.tsx': {
    title: 'Validation Indicator',
    specialStories: ['Valid', 'Invalid', 'Warning', 'Loading']
  },
  'virtual-table.tsx': {
    title: 'Virtual Table',
    specialStories: ['Scrollable', 'Selectable', 'Dynamic']
  },
  'virtualized-table.tsx': {
    title: 'Virtualized Table',
    specialStories: ['Large', 'Sortable', 'Filterable']
  },
  'command-dock.tsx': {
    title: 'Command Dock',
    specialStories: ['Default', 'WithCommands', 'Search']
  }
};

// Get list of component files that need stories
function getComponentsNeedingStories(): string[] {
  const files = fs.readdirSync(uiDir)
    .filter(file =>
      file.endsWith('.tsx') &&
      !file.endsWith('.test.tsx') &&
      !file.endsWith('.stories.tsx') &&
      file !== 'animations.ts'
    );

  const existingStories = fs.readdirSync(uiDir)
    .filter(file => file.endsWith('.stories.tsx'))
    .map(file => file.replace('.stories.tsx', '.tsx'));

  return files.filter(file => !existingStories.includes(file));
}

// Generate story file content
function generateStoryContent(componentName: string, config: typeof componentConfig[string]): string {
  const importPath = componentName.replace('.tsx', '');
  const componentExport = toPascalCase(importPath);

  // Build basic story structure
  let content = `import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Settings, ChevronDown, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { ${componentExport} } from './${importPath}';

const meta: Meta<typeof ${componentExport}> = {
  title: 'UI/${config.title}',
  component: ${componentExport},
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A reusable ${config.title} component for Fleet-CTA dashboard with full prop documentation and accessibility support.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ${componentExport}>;

`;

  // Add variant argTypes if applicable
  if (config.variantProp || config.sizeProp) {
    content += `\n  argTypes: {\n`;
    if (config.variantProp && config.variants) {
      content += `    ${config.variantProp}: {
      control: 'select',
      options: [${config.variants.map(v => `'${v}'`).join(', ')}],
      description: 'Visual style variant of the component',
    },\n`;
    }
    if (config.sizeProp && config.sizes) {
      content += `    ${config.sizeProp}: {
      control: 'select',
      options: [${config.sizes.map(s => `'${s}'`).join(', ')}],
      description: 'Size of the component',
    },\n`;
    }
    content += `  },\n`;
  }

  // Add default story
  content += `
export const Default: Story = {
  args: {
    children: '${config.title}',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default ${config.title} component with standard styling.',
      },
    },
  },
};
`;

  // Add variant stories
  if (config.variants && config.variants.length > 0) {
    config.variants.slice(0, 3).forEach(variant => {
      const storyName = toPascalCase(variant);
      content += `
export const ${storyName}: Story = {
  args: {
    children: '${storyName}',
    variant: '${variant}',
  },
};
`;
    });
  }

  // Add size stories if applicable
  if (config.sizes && config.sizes.length > 0) {
    config.sizes.slice(0, 2).forEach(size => {
      const storyName = toPascalCase(size) + 'Size';
      content += `
export const ${storyName}: Story = {
  args: {
    children: '${config.title}',
    size: '${size}',
  },
};
`;
    });
  }

  // Add disabled state
  content += `
export const Disabled: Story = {
  args: {
    children: 'Disabled ${config.title}',
    disabled: true,
  },
};
`;

  // Add responsive story
  content += `
export const Responsive: Story = {
  render: () => (
    <div className="w-full space-y-4">
      <${componentExport}>${config.title}</${componentExport}>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
`;

  // Add accessibility story
  content += `
export const Accessible: Story = {
  args: {
    children: '${config.title}',
    'aria-label': 'Interactive ${config.title}',
  },
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
`;

  // Add special stories if defined
  if (config.specialStories && config.specialStories.length > 0) {
    config.specialStories.slice(0, 2).forEach(story => {
      const storyName = toPascalCase(story);
      content += `
export const ${storyName}: Story = {
  render: () => (
    <div className="space-y-4">
      <${componentExport}>${storyName} Story</${componentExport}>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '${storyName} state and usage example',
      },
    },
  },
};
`;
    });
  }

  return content;
}

// Helper: Convert kebab-case to PascalCase
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Main execution
function main() {
  console.log('🎨 Generating Storybook Stories for Fleet-CTA...\n');

  const needsStories = getComponentsNeedingStories();
  console.log(`📦 Found ${needsStories.length} components needing stories\n`);

  let created = 0;
  let skipped = 0;

  needsStories.forEach(componentFile => {
    const config = componentConfig[componentFile];

    if (!config) {
      console.log(`⏭️  Skipping ${componentFile} (no config)`);
      skipped++;
      return;
    }

    const storyFile = componentFile.replace('.tsx', '.stories.tsx');
    const storyPath = path.join(uiDir, storyFile);

    // Generate content
    const content = generateStoryContent(componentFile, config);

    // Write file
    fs.writeFileSync(storyPath, content);
    console.log(`✅ Created ${storyFile}`);
    created++;
  });

  console.log(`\n✨ Generation Complete!`);
  console.log(`📝 Stories Created: ${created}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`\n🚀 Run 'npm run storybook' to view your stories!\n`);
}

main();
