import type { Meta, StoryObj } from '@storybook/react';

import { Card } from './card';
import { Label } from './label';
import { RadioGroupItem as Radio, RadioGroup } from './radio-group';

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/Form/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A group of radio buttons built on Radix UI for mutually exclusive selections. Includes full accessibility support.',
      },
    },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center space-x-2">
        <Radio value="option-1" id="radio-1" />
        <Label htmlFor="radio-1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="option-2" id="radio-2" />
        <Label htmlFor="radio-2">Option 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="option-3" id="radio-3" />
        <Label htmlFor="radio-3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <RadioGroup defaultValue="sedan" className="space-y-3">
      <div className="flex items-center space-x-2">
        <Radio value="sedan" id="radio-sedan" />
        <Label htmlFor="radio-sedan">Sedan</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="suv" id="radio-suv" />
        <Label htmlFor="radio-suv">SUV</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="truck" id="radio-truck" />
        <Label htmlFor="radio-truck">Truck</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="van" id="radio-van" />
        <Label htmlFor="radio-van">Van</Label>
      </div>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="monthly" className="flex items-center space-x-6">
      <div className="flex items-center space-x-2">
        <Radio value="daily" id="radio-daily" />
        <Label htmlFor="radio-daily">Daily</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="weekly" id="radio-weekly" />
        <Label htmlFor="radio-weekly">Weekly</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="monthly" id="radio-monthly" />
        <Label htmlFor="radio-monthly">Monthly</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <RadioGroup defaultValue="fuel-efficient" className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Radio value="fuel-efficient" id="radio-fuel" />
          <Label htmlFor="radio-fuel" className="font-medium">
            Fuel Efficient
          </Label>
        </div>
        <p className="text-sm text-muted-foreground ml-6">
          Optimized for minimal fuel consumption
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Radio value="performance" id="radio-perf" />
          <Label htmlFor="radio-perf" className="font-medium">
            Performance
          </Label>
        </div>
        <p className="text-sm text-muted-foreground ml-6">
          Prioritize speed and power delivery
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Radio value="balanced" id="radio-bal" />
          <Label htmlFor="radio-bal" className="font-medium">
            Balanced
          </Label>
        </div>
        <p className="text-sm text-muted-foreground ml-6">
          Balance between efficiency and performance
        </p>
      </div>
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Radio group with descriptions for each option',
      },
    },
  },
};

export const CardLayout: Story = {
  render: () => (
    <RadioGroup defaultValue="standard" className="space-y-3">
      <Card className="p-4 cursor-pointer hover:bg-accent border-2 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
        <div className="flex items-center space-x-3">
          <Radio value="standard" id="radio-standard" />
          <div className="flex-1">
            <Label htmlFor="radio-standard" className="font-semibold cursor-pointer">
              Standard Plan
            </Label>
            <p className="text-sm text-muted-foreground">$29/month</p>
          </div>
        </div>
      </Card>
      <Card className="p-4 cursor-pointer hover:bg-accent border-2 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
        <div className="flex items-center space-x-3">
          <Radio value="professional" id="radio-pro" />
          <div className="flex-1">
            <Label htmlFor="radio-pro" className="font-semibold cursor-pointer">
              Professional Plan
            </Label>
            <p className="text-sm text-muted-foreground">$99/month</p>
          </div>
        </div>
      </Card>
      <Card className="p-4 cursor-pointer hover:bg-accent border-2 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
        <div className="flex items-center space-x-3">
          <Radio value="enterprise" id="radio-ent" />
          <div className="flex-1">
            <Label htmlFor="radio-ent" className="font-semibold cursor-pointer">
              Enterprise Plan
            </Label>
            <p className="text-sm text-muted-foreground">Custom pricing</p>
          </div>
        </div>
      </Card>
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Radio group with card-based layout for complex selections',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="enabled" className="space-y-2">
      <div className="flex items-center space-x-2">
        <Radio value="enabled" id="radio-enabled" />
        <Label htmlFor="radio-enabled">Enabled</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="disabled" id="radio-disabled" disabled />
        <Label htmlFor="radio-disabled" className="opacity-50 cursor-not-allowed">
          Disabled Option
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="readonly" id="radio-readonly" />
        <Label htmlFor="radio-readonly">Read Only</Label>
      </div>
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Radio group with disabled state',
      },
    },
  },
};

export const FleetTypeSelection: Story = {
  render: () => (
    <RadioGroup defaultValue="mixed" className="space-y-3">
      <div className="flex items-center space-x-2">
        <Radio value="light-duty" id="radio-light" />
        <Label htmlFor="radio-light" className="font-medium">
          Light Duty (Cars & Sedans)
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="medium-duty" id="radio-medium" />
        <Label htmlFor="radio-medium" className="font-medium">
          Medium Duty (Vans & Small Trucks)
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="heavy-duty" id="radio-heavy" />
        <Label htmlFor="radio-heavy" className="font-medium">
          Heavy Duty (Large Trucks & Buses)
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="mixed" id="radio-mixed" defaultChecked />
        <Label htmlFor="radio-mixed" className="font-medium">
          Mixed Fleet
        </Label>
      </div>
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fleet type selection pattern',
      },
    },
  },
};

export const FilteringPattern: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm mb-3">Vehicle Status</h3>
        <RadioGroup defaultValue="all" className="space-y-2">
          <div className="flex items-center space-x-2">
            <Radio value="all" id="filter-all" />
            <Label htmlFor="filter-all">All Vehicles</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Radio value="active" id="filter-active" />
            <Label htmlFor="filter-active">Active Only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Radio value="idle" id="filter-idle" />
            <Label htmlFor="filter-idle">Idle Only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Radio value="maintenance" id="filter-maint" />
            <Label htmlFor="filter-maint">In Maintenance</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold text-sm mb-3">Sort By</h3>
        <RadioGroup defaultValue="name" className="space-y-2">
          <div className="flex items-center space-x-2">
            <Radio value="name" id="sort-name" />
            <Label htmlFor="sort-name">Vehicle Name</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Radio value="mileage" id="sort-mileage" />
            <Label htmlFor="sort-mileage">Mileage</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Radio value="date" id="sort-date" />
            <Label htmlFor="sort-date">Last Updated</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple radio groups for filtering and sorting',
      },
    },
  },
};

export const Accessible: Story = {
  render: () => (
    <fieldset className="space-y-4">
      <legend className="font-semibold mb-4">Vehicle Assignment</legend>
      <RadioGroup defaultValue="john" className="space-y-3">
        <div className="flex items-center space-x-2">
          <Radio
            value="john"
            id="driver-john"
            aria-label="Assign to John Smith"
            aria-describedby="john-details"
          />
          <div>
            <Label htmlFor="driver-john" className="font-medium">
              John Smith
            </Label>
            <p id="john-details" className="text-xs text-muted-foreground">
              15 years experience, excellent safety record
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Radio
            value="sarah"
            id="driver-sarah"
            aria-label="Assign to Sarah Johnson"
            aria-describedby="sarah-details"
          />
          <div>
            <Label htmlFor="driver-sarah" className="font-medium">
              Sarah Johnson
            </Label>
            <p id="sarah-details" className="text-xs text-muted-foreground">
              8 years experience, certified trainer
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Radio
            value="michael"
            id="driver-michael"
            aria-label="Assign to Michael Brown"
            aria-describedby="michael-details"
          />
          <div>
            <Label htmlFor="driver-michael" className="font-medium">
              Michael Brown
            </Label>
            <p id="michael-details" className="text-xs text-muted-foreground">
              5 years experience, new to fleet
            </p>
          </div>
        </div>
      </RadioGroup>
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
        story: 'Radio group with proper ARIA labels and descriptions',
      },
    },
  },
};

export const Responsive: Story = {
  render: () => (
    <RadioGroup defaultValue="all" className="space-y-2">
      <div className="flex items-center space-x-2">
        <Radio value="all" id="resp-all" />
        <Label htmlFor="resp-all">All Vehicles</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="active" id="resp-active" />
        <Label htmlFor="resp-active">Active</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Radio value="offline" id="resp-offline" />
        <Label htmlFor="resp-offline">Offline</Label>
      </div>
    </RadioGroup>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive radio group layout',
      },
    },
  },
};
