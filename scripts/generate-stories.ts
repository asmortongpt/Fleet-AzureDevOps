#!/usr/bin/env tsx
/**
 * Automated Story Generator
 * Generates Storybook stories for all UI components
 */

import fs from 'fs';
import path from 'path';

const storiesTemplate = `import type { Meta, StoryObj } from '@storybook/react';
import { {{COMPONENT_NAME}} } from './{{COMPONENT_FILE}}';

const meta: Meta<typeof {{COMPONENT_NAME}}> = {
  title: 'UI/{{COMPONENT_NAME}}',
  component: {{COMPONENT_NAME}},
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof {{COMPONENT_NAME}}>;

export const Default: Story = {
  args: {},
};
`;

const components = [
  { name: 'Alert', file: 'alert' },
  { name: 'AlertDialog', file: 'alert-dialog' },
  { name: 'Avatar', file: 'avatar' },
  { name: 'Checkbox', file: 'checkbox' },
  { name: 'Switch', file: 'switch' },
  { name: 'Select', file: 'select' },
  { name: 'Slider', file: 'slider' },
  { name: 'Progress', file: 'progress' },
  { name: 'Tabs', file: 'tabs' },
  { name: 'Table', file: 'table' },
  { name: 'Skeleton', file: 'skeleton' },
  { name: 'Separator', file: 'separator' },
  { name: 'Scroll Area', file: 'scroll-area' },
  { name: 'Popover', file: 'popover' },
  { name: 'Hover Card', file: 'hover-card' },
  { name: 'Drawer', file: 'drawer' },
  { name: 'Toast', file: 'sonner' },
  { name: 'Toggle', file: 'toggle' },
  { name: 'ToggleGroup', file: 'toggle-group' },
  { name: 'Collapsible', file: 'collapsible' },
];

const srcDir = path.join(process.cwd(), 'src/components/ui');

components.forEach(({ name, file }) => {
  const storyFile = path.join(srcDir, `${file}.stories.tsx`);

  // Skip if story already exists
  if (fs.existsSync(storyFile)) {
    console.log(`✓ Story already exists: ${file}.stories.tsx`);
    return;
  }

  const content = storiesTemplate
    .replace(/{{COMPONENT_NAME}}/g, name)
    .replace(/{{COMPONENT_FILE}}/g, file);

  fs.writeFileSync(storyFile, content);
  console.log(`✓ Created story: ${file}.stories.tsx`);
});

console.log('\n✅ Story generation complete!');
