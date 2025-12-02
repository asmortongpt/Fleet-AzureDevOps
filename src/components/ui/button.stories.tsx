import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Trash2, Download, Plus, Settings } from 'lucide-react'

/**
 * Button component stories demonstrating all variants, sizes, and use cases.
 */
const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Primary interactive element for user actions. Built on Radix UI with full accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as Radix Slot for composition',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default primary button style
 */
export const Default: Story = {
  args: {
    children: 'Button',
  },
}

/**
 * Destructive actions (delete, remove)
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}

/**
 * Outlined button with border
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

/**
 * Secondary button with subtle background
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

/**
 * Ghost button with no background until hover
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
}

/**
 * Link-styled button
 */
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
}

/**
 * Small size button
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
}

/**
 * Large size button
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
}

/**
 * Icon-only button (square)
 */
export const Icon: Story = {
  args: {
    size: 'icon',
    children: <Settings />,
  },
}

/**
 * Button with icon and text
 */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Download />
        Download
      </>
    ),
  },
}

/**
 * Disabled button
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
}

/**
 * All sizes showcase
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus />
      </Button>
    </div>
  ),
}

/**
 * Real-world examples
 */
export const Examples: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button>
          <Plus />
          Create New
        </Button>
        <Button variant="outline">
          <Download />
          Export
        </Button>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="destructive">
          <Trash2 />
          Delete
        </Button>
        <Button variant="secondary">Cancel</Button>
        <Button>Confirm</Button>
      </div>
    </div>
  ),
}
