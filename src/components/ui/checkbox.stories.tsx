import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

import { Checkbox } from './checkbox';
import { Label } from './label';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Form/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A versatile checkbox component built on Radix UI with support for checked, unchecked, and indeterminate states. Includes full accessibility features.',
      },
    },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    id: 'checkbox-default',
  },
  render: (args: Record<string, unknown>) => (
    <div className="flex items-center space-x-2">
      <Checkbox {...args} />
      <Label htmlFor="checkbox-default">Accept terms and conditions</Label>
    </div>
  ),
};

export const Checked: Story = {
  args: {
    id: 'checkbox-checked',
    defaultChecked: true,
  },
  render: (args: Record<string, unknown>) => (
    <div className="flex items-center space-x-2">
      <Checkbox {...args} />
      <Label htmlFor="checkbox-checked">Checkbox is checked</Label>
    </div>
  ),
};

export const Unchecked: Story = {
  args: {
    id: 'checkbox-unchecked',
    defaultChecked: false,
  },
  render: (args: Record<string, unknown>) => (
    <div className="flex items-center space-x-2">
      <Checkbox {...args} />
      <Label htmlFor="checkbox-unchecked">Checkbox is unchecked</Label>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    id: 'checkbox-disabled',
    disabled: true,
  },
  render: (args: Record<string, unknown>) => (
    <div className="flex items-center space-x-2">
      <Checkbox {...args} />
      <Label htmlFor="checkbox-disabled" className="opacity-50 cursor-not-allowed">
        Disabled checkbox
      </Label>
    </div>
  ),
};

export const DisabledChecked: Story = {
  args: {
    id: 'checkbox-disabled-checked',
    disabled: true,
    defaultChecked: true,
  },
  render: (args: Record<string, unknown>) => (
    <div className="flex items-center space-x-2">
      <Checkbox {...args} />
      <Label htmlFor="checkbox-disabled-checked" className="opacity-50 cursor-not-allowed">
        Disabled and checked
      </Label>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="vehicle-car" defaultChecked />
        <Label htmlFor="vehicle-car">Car</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="vehicle-truck" />
        <Label htmlFor="vehicle-truck">Truck</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="vehicle-bus" defaultChecked />
        <Label htmlFor="vehicle-bus">Bus</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="vehicle-other" disabled />
        <Label htmlFor="vehicle-other" className="opacity-50 cursor-not-allowed">
          Other (Disabled)
        </Label>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A group of checkboxes for multi-select options',
      },
    },
  },
};

export const WithDescription: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-start space-x-2">
        <Checkbox id="notifications-email" defaultChecked className="mt-1" />
        <div>
          <Label htmlFor="notifications-email" className="font-medium">
            Email Notifications
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Receive email updates about fleet status and alerts
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <Checkbox id="notifications-sms" className="mt-1" />
        <div>
          <Label htmlFor="notifications-sms" className="font-medium">
            SMS Notifications
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Get SMS alerts for critical vehicle events
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <Checkbox id="notifications-push" defaultChecked className="mt-1" />
        <div>
          <Label htmlFor="notifications-push" className="font-medium">
            Push Notifications
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Browser notifications for real-time updates
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Checkboxes with descriptions for each option',
      },
    },
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
        <Checkbox id="feature-gps" defaultChecked />
        <div className="flex-1">
          <Label htmlFor="feature-gps" className="font-medium cursor-pointer">
            GPS Tracking
          </Label>
        </div>
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      </div>
      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
        <Checkbox id="feature-telematics" />
        <div className="flex-1">
          <Label htmlFor="feature-telematics" className="font-medium cursor-pointer">
            Telematics
          </Label>
        </div>
        <AlertCircle className="w-4 h-4 text-yellow-500" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Checkboxes with icons showing feature status',
      },
    },
  },
};

export const VehicleFilters: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="font-semibold text-sm">Vehicle Status</div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="status-active" defaultChecked />
          <Label htmlFor="status-active">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="status-idle" defaultChecked />
          <Label htmlFor="status-idle">Idle</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="status-maintenance" />
          <Label htmlFor="status-maintenance">In Maintenance</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="status-offline" />
          <Label htmlFor="status-offline">Offline</Label>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common fleet filter pattern using checkboxes',
      },
    },
  },
};

export const FormValidation: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="space-y-2 p-3 border-l-2 border-destructive bg-destructive/5 rounded">
        <div className="flex items-center space-x-2">
          <Checkbox id="agree-terms" />
          <Label htmlFor="agree-terms" className="text-destructive">
            I agree to the terms (required)
          </Label>
        </div>
        <p className="text-xs text-destructive">Please check this box to continue</p>
      </div>
      <div className="space-y-2 p-3 border-l-2 border-emerald-500 bg-emerald-500/5 rounded">
        <div className="flex items-center space-x-2">
          <Checkbox id="agree-privacy" defaultChecked />
          <Label htmlFor="agree-privacy" className="text-emerald-700">
            I agree to the privacy policy
          </Label>
        </div>
        <p className="text-xs text-emerald-600">Validation passed</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Form validation states with checkboxes',
      },
    },
  },
};

export const SelectAllPattern: Story = {
  render: () => (
    <div className="space-y-3 border rounded-lg p-4">
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Checkbox id="select-all" defaultChecked />
        <Label htmlFor="select-all" className="font-semibold">
          Select All Drivers
        </Label>
      </div>
      <div className="space-y-2 ml-6">
        <div className="flex items-center space-x-2">
          <Checkbox id="driver-1" defaultChecked />
          <Label htmlFor="driver-1">John Smith</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="driver-2" defaultChecked />
          <Label htmlFor="driver-2">Sarah Johnson</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="driver-3" defaultChecked />
          <Label htmlFor="driver-3">Michael Brown</Label>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select-all checkbox pattern with indented sub-items',
      },
    },
  },
};

export const Accessible: Story = {
  render: () => (
    <fieldset className="space-y-4 border rounded p-4">
      <legend className="font-semibold">Fleet Options</legend>
      <div className="flex items-center space-x-2">
        <Checkbox id="checkbox-a11y-1" aria-label="Enable GPS tracking for all vehicles" />
        <Label htmlFor="checkbox-a11y-1">GPS Tracking</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="checkbox-a11y-2"
          aria-label="Enable real-time driver monitoring"
          aria-describedby="checkbox-a11y-2-help"
        />
        <Label htmlFor="checkbox-a11y-2">Driver Monitoring</Label>
      </div>
      <p id="checkbox-a11y-2-help" className="text-xs text-muted-foreground">
        Monitors driver behavior and safety metrics
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
        story: 'Checkbox group with proper ARIA labels and descriptions for accessibility',
      },
    },
  },
};

export const Responsive: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="resp-1" defaultChecked />
          <Label htmlFor="resp-1">Option 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="resp-2" />
          <Label htmlFor="resp-2">Option 2</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="resp-3" defaultChecked />
          <Label htmlFor="resp-3">Option 3</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="resp-4" />
          <Label htmlFor="resp-4">Option 4</Label>
        </div>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive checkbox layout that adapts to different screen sizes',
      },
    },
  },
};
