import type { Meta, StoryObj } from '@storybook/react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Code, List } from 'lucide-react';

import { ToggleGroup, ToggleGroupItem } from './toggle-group';

const meta: Meta<typeof ToggleGroup> = {
  title: 'UI/Form/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A group of toggle buttons for exclusive or multiple selections. Built on Radix UI for full keyboard navigation and accessibility.',
      },
    },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="center">
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Single: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="list">
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="code" aria-label="Code view">
        <Code className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="type" aria-label="Type view">
        <Type className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroup type="multiple" defaultValue={['bold', 'underline']}>
      <ToggleGroupItem value="bold" aria-label="Bold">
        <Bold className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        <Italic className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        <Underline className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple selection toggle group allowing multiple active items',
      },
    },
  },
};

export const Horizontal: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="day" className="flex">
      <ToggleGroupItem value="week" aria-label="Weekly">
        Week
      </ToggleGroupItem>
      <ToggleGroupItem value="day" aria-label="Daily">
        Day
      </ToggleGroupItem>
      <ToggleGroupItem value="month" aria-label="Monthly">
        Month
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="all" orientation="vertical">
      <ToggleGroupItem value="all" aria-label="All vehicles">
        All Vehicles
      </ToggleGroupItem>
      <ToggleGroupItem value="active" aria-label="Active only">
        Active Only
      </ToggleGroupItem>
      <ToggleGroupItem value="idle" aria-label="Idle">
        Idle
      </ToggleGroupItem>
      <ToggleGroupItem value="maintenance" aria-label="Maintenance">
        In Maintenance
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vertical orientation for filtering',
      },
    },
  },
};

export const WithText: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="standard">
      <ToggleGroupItem value="standard" aria-label="Standard">
        <span className="mr-2">Standard</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="plus" aria-label="Plus">
        <span className="mr-2">Plus</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="pro" aria-label="Pro">
        <span className="mr-2">Pro</span>
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Toggle group with text labels',
      },
    },
  },
};

export const TextFormattingToolbar: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex gap-2 border rounded-lg p-2 bg-muted">
        <div className="flex gap-1 border-r pr-2">
          <ToggleGroup type="single" defaultValue="left" className="flex">
            <ToggleGroupItem value="left" aria-label="Align left" size="sm">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center" size="sm">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right" size="sm">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex gap-1">
          <ToggleGroup type="multiple" defaultValue={['bold']} className="flex">
            <ToggleGroupItem value="bold" aria-label="Bold" size="sm">
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic" size="sm">
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline" size="sm">
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete text formatting toolbar with both single and multiple selection groups',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="enabled" disabled>
      <ToggleGroupItem value="enabled" aria-label="Enabled">
        Enabled
      </ToggleGroupItem>
      <ToggleGroupItem value="disabled" aria-label="Disabled">
        Disabled
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled toggle group',
      },
    },
  },
};

export const VehicleStatusFilter: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Filter by Status</h3>
      <ToggleGroup type="multiple" defaultValue={['active', 'idle']} className="flex flex-wrap gap-2">
        <ToggleGroupItem value="active" aria-label="Active vehicles">
          Active
        </ToggleGroupItem>
        <ToggleGroupItem value="idle" aria-label="Idle vehicles">
          Idle
        </ToggleGroupItem>
        <ToggleGroupItem value="maintenance" aria-label="Maintenance">
          Maintenance
        </ToggleGroupItem>
        <ToggleGroupItem value="offline" aria-label="Offline vehicles">
          Offline
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fleet vehicle status filtering with multiple selections',
      },
    },
  },
};

export const TimeframeSelector: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Select Timeframe</h3>
      <ToggleGroup type="single" defaultValue="week" className="flex">
        <ToggleGroupItem value="day" aria-label="Day">
          Today
        </ToggleGroupItem>
        <ToggleGroupItem value="week" aria-label="Week">
          This Week
        </ToggleGroupItem>
        <ToggleGroupItem value="month" aria-label="Month">
          This Month
        </ToggleGroupItem>
        <ToggleGroupItem value="year" aria-label="Year">
          This Year
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Timeframe selection for analytics',
      },
    },
  },
};

export const SizeVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Small</p>
        <ToggleGroup type="single" defaultValue="sm" className="flex gap-1">
          <ToggleGroupItem value="sm" size="sm" aria-label="Small">
            S
          </ToggleGroupItem>
          <ToggleGroupItem value="md" size="sm" aria-label="Medium">
            M
          </ToggleGroupItem>
          <ToggleGroupItem value="lg" size="sm" aria-label="Large">
            L
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Default</p>
        <ToggleGroup type="single" defaultValue="md" className="flex gap-1">
          <ToggleGroupItem value="sm" aria-label="Small">
            S
          </ToggleGroupItem>
          <ToggleGroupItem value="md" aria-label="Medium">
            M
          </ToggleGroupItem>
          <ToggleGroupItem value="lg" aria-label="Large">
            L
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Large</p>
        <ToggleGroup type="single" defaultValue="lg" className="flex gap-2">
          <ToggleGroupItem value="sm" size="lg" aria-label="Small">
            Small
          </ToggleGroupItem>
          <ToggleGroupItem value="md" size="lg" aria-label="Medium">
            Medium
          </ToggleGroupItem>
          <ToggleGroupItem value="lg" size="lg" aria-label="Large">
            Large
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different size variants for toggle group items',
      },
    },
  },
};

export const Accessible: Story = {
  render: () => (
    <fieldset className="space-y-4">
      <legend className="font-semibold">Reporting Period</legend>
      <ToggleGroup type="single" defaultValue="monthly" className="flex">
        <ToggleGroupItem
          value="weekly"
          aria-label="Weekly report"
          aria-describedby="weekly-desc"
        >
          Weekly
        </ToggleGroupItem>
        <ToggleGroupItem
          value="monthly"
          aria-label="Monthly report"
          aria-describedby="monthly-desc"
        >
          Monthly
        </ToggleGroupItem>
        <ToggleGroupItem
          value="yearly"
          aria-label="Yearly report"
          aria-describedby="yearly-desc"
        >
          Yearly
        </ToggleGroupItem>
      </ToggleGroup>
      <p id="weekly-desc" className="text-xs text-muted-foreground">
        Generate weekly performance reports
      </p>
    </fieldset>
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
    docs: {
      description: {
        story: 'Toggle group with proper ARIA labels for accessibility',
      },
    },
  },
};

export const Responsive: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="list" className="flex flex-wrap gap-1">
      <ToggleGroupItem value="list" aria-label="List view">
        List
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view">
        Grid
      </ToggleGroupItem>
      <ToggleGroupItem value="compact" aria-label="Compact view">
        Compact
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive toggle group that wraps on mobile',
      },
    },
  },
};
