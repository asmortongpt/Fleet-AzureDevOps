import type { Meta, StoryObj } from '@storybook/react';
import { Bell, Lock, Eye, MapPin, AlertTriangle } from 'lucide-react';
import { Switch } from './switch';
import { Label } from './label';
import { Card } from './card';

const meta: Meta<typeof Switch> = {
  title: 'UI/Form/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'An accessible toggle switch component built on Radix UI for boolean settings. Supports disabled state and full keyboard navigation.',
      },
    },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    id: 'switch-default',
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Switch {...args} />
      <Label htmlFor="switch-default">Enable Feature</Label>
    </div>
  ),
};

export const Checked: Story = {
  args: {
    id: 'switch-checked',
    defaultChecked: true,
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Switch {...args} />
      <Label htmlFor="switch-checked">Feature Enabled</Label>
    </div>
  ),
};

export const Unchecked: Story = {
  args: {
    id: 'switch-unchecked',
    defaultChecked: false,
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Switch {...args} />
      <Label htmlFor="switch-unchecked">Feature Disabled</Label>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    id: 'switch-disabled',
    disabled: true,
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Switch {...args} />
      <Label htmlFor="switch-disabled" className="opacity-50 cursor-not-allowed">
        Disabled Switch
      </Label>
    </div>
  ),
};

export const DisabledChecked: Story = {
  args: {
    id: 'switch-disabled-checked',
    disabled: true,
    defaultChecked: true,
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Switch {...args} />
      <Label htmlFor="switch-disabled-checked" className="opacity-50 cursor-not-allowed">
        Disabled and Enabled
      </Label>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4" />
          <Label htmlFor="switch-notify" className="font-medium">
            Notifications
          </Label>
        </div>
        <Switch id="switch-notify" defaultChecked />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4" />
          <Label htmlFor="switch-security" className="font-medium">
            Enhanced Security
          </Label>
        </div>
        <Switch id="switch-security" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4" />
          <Label htmlFor="switch-visibility" className="font-medium">
            Show Details
          </Label>
        </div>
        <Switch id="switch-visibility" defaultChecked />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Switches with icons for visual context',
      },
    },
  },
};

export const WithDescription: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="switch-gps" className="font-medium">
            Real-time GPS Tracking
          </Label>
          <Switch id="switch-gps" defaultChecked />
        </div>
        <p className="text-sm text-muted-foreground">
          Enable real-time vehicle location tracking on the dashboard
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="switch-alerts" className="font-medium">
            Safety Alerts
          </Label>
          <Switch id="switch-alerts" defaultChecked />
        </div>
        <p className="text-sm text-muted-foreground">
          Receive alerts for speeding, harsh braking, and other safety events
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="switch-reporting" className="font-medium">
            Weekly Reports
          </Label>
          <Switch id="switch-reporting" />
        </div>
        <p className="text-sm text-muted-foreground">
          Receive weekly fleet performance and maintenance reports
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Switches with descriptions for settings',
      },
    },
  },
};

export const NotificationSettings: Story = {
  render: () => (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Notification Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email-notif" className="font-medium">
              Email Notifications
            </Label>
            <p className="text-xs text-muted-foreground">Updates sent to your email</p>
          </div>
          <Switch id="email-notif" defaultChecked />
        </div>
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <Label htmlFor="sms-notif" className="font-medium">
              SMS Alerts
            </Label>
            <Switch id="sms-notif" />
          </div>
          <p className="text-xs text-muted-foreground">Critical alerts sent via SMS</p>
        </div>
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <Label htmlFor="push-notif" className="font-medium">
              Push Notifications
            </Label>
            <Switch id="push-notif" defaultChecked />
          </div>
          <p className="text-xs text-muted-foreground">Browser and app notifications</p>
        </div>
      </div>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Settings panel with multiple switches',
      },
    },
  },
};

export const FeatureToggle: Story = {
  render: () => (
    <div className="space-y-3">
      <Card className="p-4 flex items-center justify-between hover:bg-accent">
        <div>
          <h4 className="font-semibold">Advanced Analytics</h4>
          <p className="text-xs text-muted-foreground">Premium feature</p>
        </div>
        <Switch id="feature-analytics" />
      </Card>
      <Card className="p-4 flex items-center justify-between hover:bg-accent">
        <div>
          <h4 className="font-semibold">Custom Reports</h4>
          <p className="text-xs text-muted-foreground">Enterprise only</p>
        </div>
        <Switch id="feature-reports" defaultChecked />
      </Card>
      <Card className="p-4 flex items-center justify-between hover:bg-accent bg-muted/30">
        <div>
          <h4 className="font-semibold opacity-50">API Access</h4>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </div>
        <Switch id="feature-api" disabled />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Feature toggle patterns for premium features',
      },
    },
  },
};

export const WarningState: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Card className="p-4 border-l-2 border-yellow-500 bg-yellow-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <Label htmlFor="dev-mode" className="font-semibold text-yellow-900">
              Development Mode
            </Label>
          </div>
          <Switch id="dev-mode" />
        </div>
        <p className="text-sm text-yellow-800">
          Development mode bypasses certain security features. Use with caution.
        </p>
      </Card>

      <Card className="p-4 border-l-2 border-emerald-500 bg-emerald-50">
        <div className="flex items-center justify-between mb-3">
          <Label htmlFor="prod-mode" className="font-semibold text-emerald-900">
            Production Mode
          </Label>
          <Switch id="prod-mode" defaultChecked />
        </div>
        <p className="text-sm text-emerald-800">
          All security features enabled. This is the recommended configuration.
        </p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Warning and confirmation states for critical toggles',
      },
    },
  },
};

export const FleetManagementSettings: Story = {
  render: () => (
    <Card className="p-6 max-w-md">
      <h3 className="font-semibold text-base mb-4">Fleet Settings</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-3 border-b">
          <Label htmlFor="gps-track" className="font-medium">
            GPS Tracking
          </Label>
          <Switch id="gps-track" defaultChecked />
        </div>
        <div className="flex items-center justify-between pb-3 border-b">
          <Label htmlFor="driver-mon" className="font-medium">
            Driver Monitoring
          </Label>
          <Switch id="driver-mon" defaultChecked />
        </div>
        <div className="flex items-center justify-between pb-3 border-b">
          <Label htmlFor="fuel-track" className="font-medium">
            Fuel Tracking
          </Label>
          <Switch id="fuel-track" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="maintenance" className="font-medium">
            Maintenance Alerts
          </Label>
          <Switch id="maintenance" defaultChecked />
        </div>
      </div>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fleet management feature toggles',
      },
    },
  },
};

export const Accessible: Story = {
  render: () => (
    <fieldset className="space-y-4 border rounded p-4">
      <legend className="font-semibold">Accessibility Options</legend>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="switch-a11y-1" className="font-medium">
            High Contrast
          </Label>
          <p id="switch-a11y-1-desc" className="text-xs text-muted-foreground">
            Increases visibility for users with low vision
          </p>
        </div>
        <Switch
          id="switch-a11y-1"
          aria-describedby="switch-a11y-1-desc"
        />
      </div>
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          <Label htmlFor="switch-a11y-2" className="font-medium">
            Reduce Motion
          </Label>
          <p id="switch-a11y-2-desc" className="text-xs text-muted-foreground">
            Disables animations and transitions
          </p>
        </div>
        <Switch
          id="switch-a11y-2"
          aria-describedby="switch-a11y-2-desc"
        />
      </div>
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
        story: 'Switches with ARIA labels and descriptions for accessibility',
      },
    },
  },
};

export const Responsive: Story = {
  render: () => (
    <div className="space-y-3 w-full max-w-md">
      <div className="flex items-center justify-between">
        <Label htmlFor="resp-1" className="text-sm">
          Feature 1
        </Label>
        <Switch id="resp-1" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="resp-2" className="text-sm">
          Feature 2
        </Label>
        <Switch id="resp-2" />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="resp-3" className="text-sm">
          Feature 3
        </Label>
        <Switch id="resp-3" defaultChecked />
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive switch layout that adapts to mobile',
      },
    },
  },
};
