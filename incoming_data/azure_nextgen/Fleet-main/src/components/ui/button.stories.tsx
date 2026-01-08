import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Trash2, Download, Upload, Settings, CheckCircle2 } from 'lucide-react';

import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'touch'],
      description: 'Size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    asChild: {
      control: 'boolean',
      description: 'Merge props with child element',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes, optimized for accessibility and touch targets.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'link',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    children: <Plus className="h-4 w-4" />,
  },
};

export const Touch: Story = {
  args: {
    children: 'Touch Optimized',
    size: 'touch',
  },
  parameters: {
    docs: {
      description: {
        story: '44x44px minimum touch target for mobile devices',
      },
    },
  },
};

export const WithIconLeft: Story = {
  render: () => (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Vehicle
    </Button>
  ),
};

export const WithIconRight: Story = {
  render: () => (
    <Button>
      Download Report
      <Download className="ml-2 h-4 w-4" />
    </Button>
  ),
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Loading: Story = {
  render: () => (
    <Button disabled>
      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Loading...
    </Button>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants displayed together',
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Settings className="h-4 w-4" />
      </Button>
      <Button size="touch">Touch</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button sizes displayed together',
      },
    },
  },
};

export const FleetActions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Vehicle
      </Button>
      <Button variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button variant="secondary">
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
      <Button variant="ghost">
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </Button>
      <Button variant="outline">
        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
        Approve
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common fleet management actions with icons',
      },
    },
  },
};

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-4">
      <Button aria-label="Add new vehicle to fleet">
        <Plus className="h-4 w-4" />
      </Button>
      <Button aria-describedby="button-description">
        Action with Description
      </Button>
      <p id="button-description" className="text-sm text-muted-foreground">
        This button performs an important action
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with proper ARIA labels and descriptions for screen readers',
      },
    },
  },
};

export const ResponsiveGroup: Story = {
  render: () => (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button className="w-full sm:w-auto">Primary Action</Button>
      <Button variant="outline" className="w-full sm:w-auto">
        Secondary Action
      </Button>
      <Button variant="ghost" className="w-full sm:w-auto">
        Cancel
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive button group that stacks on mobile',
      },
    },
  },
};
