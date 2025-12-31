import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Wrench, Fuel } from 'lucide-react';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Error',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const VehicleStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-green-500">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Active
      </Badge>
      <Badge className="bg-yellow-500">
        <Clock className="mr-1 h-3 w-3" />
        Idle
      </Badge>
      <Badge className="bg-orange-500">
        <Wrench className="mr-1 h-3 w-3" />
        Maintenance
      </Badge>
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Out of Service
      </Badge>
    </div>
  ),
};

export const MaintenanceAlerts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="destructive">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Critical
      </Badge>
      <Badge className="bg-orange-500">
        <AlertTriangle className="mr-1 h-3 w-3" />
        High Priority
      </Badge>
      <Badge className="bg-yellow-500 text-black">
        <Clock className="mr-1 h-3 w-3" />
        Due Soon
      </Badge>
      <Badge variant="outline">
        Scheduled
      </Badge>
    </div>
  ),
};

export const FuelLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-green-500">
        <Fuel className="mr-1 h-3 w-3" />
        Full (80-100%)
      </Badge>
      <Badge className="bg-yellow-500 text-black">
        <Fuel className="mr-1 h-3 w-3" />
        Medium (40-79%)
      </Badge>
      <Badge className="bg-orange-500">
        <Fuel className="mr-1 h-3 w-3" />
        Low (20-39%)
      </Badge>
      <Badge variant="destructive">
        <Fuel className="mr-1 h-3 w-3" />
        Critical (&lt;20%)
      </Badge>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Success
      </Badge>
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Error
      </Badge>
      <Badge className="bg-yellow-500 text-black">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Warning
      </Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className="text-xs px-1.5 py-0.5">Tiny</Badge>
      <Badge className="text-xs">Small</Badge>
      <Badge>Default</Badge>
      <Badge className="text-base px-3 py-1">Large</Badge>
    </div>
  ),
};
