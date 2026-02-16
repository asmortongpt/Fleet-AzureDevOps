import type { Meta, StoryObj } from '@storybook/react';
import { BarChart3, LineChart, PieChart, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card } from './card';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A tabbed interface component built on Radix UI for organizing content into multiple panels with tab navigation.',
      },
    },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="mt-4">
        <Card className="p-4">
          <p>Tab 1 content goes here</p>
        </Card>
      </TabsContent>
      <TabsContent value="tab2" className="mt-4">
        <Card className="p-4">
          <p>Tab 2 content goes here</p>
        </Card>
      </TabsContent>
      <TabsContent value="tab3" className="mt-4">
        <Card className="p-4">
          <p>Tab 3 content goes here</p>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Tabs defaultValue="charts" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="charts" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Charts
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-2">
          <LineChart className="h-4 w-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="reports" className="gap-2">
          <Activity className="h-4 w-4" />
          Reports
        </TabsTrigger>
      </TabsList>
      <TabsContent value="charts" className="mt-4">
        <Card className="p-4">
          <p>Chart visualization</p>
        </Card>
      </TabsContent>
      <TabsContent value="analytics" className="mt-4">
        <Card className="p-4">
          <p>Analytics data</p>
        </Card>
      </TabsContent>
      <TabsContent value="reports" className="mt-4">
        <Card className="p-4">
          <p>Report details</p>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs with icons for visual emphasis',
      },
    },
  },
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="details" orientation="vertical" className="w-full max-w-lg flex gap-4">
      <TabsList className="flex flex-col h-auto w-40">
        <TabsTrigger value="details" className="justify-start">
          Vehicle Details
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="justify-start">
          Maintenance
        </TabsTrigger>
        <TabsTrigger value="history" className="justify-start">
          History
        </TabsTrigger>
        <TabsTrigger value="documents" className="justify-start">
          Documents
        </TabsTrigger>
      </TabsList>
      <div className="flex-1">
        <TabsContent value="details">
          <Card className="p-4">
            <p>Vehicle details content</p>
          </Card>
        </TabsContent>
        <TabsContent value="maintenance">
          <Card className="p-4">
            <p>Maintenance history</p>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card className="p-4">
            <p>Full vehicle history</p>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card className="p-4">
            <p>Related documents</p>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vertical tab layout for sidebar-like navigation',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="tab1">Active</TabsTrigger>
        <TabsTrigger value="tab2" disabled>
          Disabled
        </TabsTrigger>
        <TabsTrigger value="tab3">Active</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="mt-4">
        <Card className="p-4">
          <p>Active tab content</p>
        </Card>
      </TabsContent>
      <TabsContent value="tab3" className="mt-4">
        <Card className="p-4">
          <p>Another active tab</p>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs with disabled state',
      },
    },
  },
};

export const FleetDashboard: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-2xl">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        <TabsTrigger value="drivers">Drivers</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4 space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold">Fleet Overview</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Total vehicles: 45 | Active: 38 | Idle: 5 | Maintenance: 2
          </p>
        </Card>
      </TabsContent>

      <TabsContent value="vehicles" className="mt-4 space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold">Vehicles</h3>
          <p className="text-sm text-muted-foreground mt-2">
            List of all fleet vehicles with status and location
          </p>
        </Card>
      </TabsContent>

      <TabsContent value="drivers" className="mt-4 space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold">Drivers</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Driver management and performance metrics
          </p>
        </Card>
      </TabsContent>

      <TabsContent value="analytics" className="mt-4 space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold">Analytics</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Detailed fleet performance analytics
          </p>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fleet dashboard with multiple tab sections',
      },
    },
  },
};

export const ScrollableTabs: Story = {
  render: () => (
    <Tabs defaultValue="jan" className="w-full max-w-2xl">
      <TabsList className="flex overflow-x-auto">
        <TabsTrigger value="jan" className="whitespace-nowrap">January</TabsTrigger>
        <TabsTrigger value="feb" className="whitespace-nowrap">February</TabsTrigger>
        <TabsTrigger value="mar" className="whitespace-nowrap">March</TabsTrigger>
        <TabsTrigger value="apr" className="whitespace-nowrap">April</TabsTrigger>
        <TabsTrigger value="may" className="whitespace-nowrap">May</TabsTrigger>
        <TabsTrigger value="jun" className="whitespace-nowrap">June</TabsTrigger>
        <TabsTrigger value="jul" className="whitespace-nowrap">July</TabsTrigger>
        <TabsTrigger value="aug" className="whitespace-nowrap">August</TabsTrigger>
        <TabsTrigger value="sep" className="whitespace-nowrap">September</TabsTrigger>
        <TabsTrigger value="oct" className="whitespace-nowrap">October</TabsTrigger>
        <TabsTrigger value="nov" className="whitespace-nowrap">November</TabsTrigger>
        <TabsTrigger value="dec" className="whitespace-nowrap">December</TabsTrigger>
      </TabsList>
      <TabsContent value="jan" className="mt-4">
        <Card className="p-4">
          <p>January data</p>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Scrollable tabs for many items',
      },
    },
  },
};

export const NestedContent: Story = {
  render: () => (
    <Tabs defaultValue="fleet" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="fleet">Fleet</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="fleet" className="mt-4">
        <Card className="p-4 space-y-4">
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Vehicles</TabsTrigger>
              <TabsTrigger value="maintenance">In Maintenance</TabsTrigger>
              <TabsTrigger value="idle">Idle</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-2">
              <Card className="p-2">
                <p>Active vehicles list</p>
              </Card>
            </TabsContent>
            <TabsContent value="maintenance" className="mt-2">
              <Card className="p-2">
                <p>Vehicles in maintenance</p>
              </Card>
            </TabsContent>
            <TabsContent value="idle" className="mt-2">
              <Card className="p-2">
                <p>Idle vehicles</p>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="mt-4">
        <Card className="p-4">
          <p>Settings content</p>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Nested tabs for hierarchical content organization',
      },
    },
  },
};

export const Accessible: Story = {
  render: () => (
    <Tabs defaultValue="summary" className="w-full max-w-md">
      <TabsList role="tablist">
        <TabsTrigger value="summary" aria-label="Summary information">
          Summary
        </TabsTrigger>
        <TabsTrigger value="details" aria-label="Detailed information">
          Details
        </TabsTrigger>
        <TabsTrigger value="analytics" aria-label="Analytics data">
          Analytics
        </TabsTrigger>
      </TabsList>
      <TabsContent value="summary">
        <Card className="p-4">
          <p>Summary content with proper ARIA labels</p>
        </Card>
      </TabsContent>
      <TabsContent value="details">
        <Card className="p-4">
          <p>Detailed content</p>
        </Card>
      </TabsContent>
      <TabsContent value="analytics">
        <Card className="p-4">
          <p>Analytics content</p>
        </Card>
      </TabsContent>
    </Tabs>
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
        story: 'Tabs with proper ARIA labels for screen readers',
      },
    },
  },
};

export const Responsive: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3" className="hidden sm:block">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="mt-4">
        <Card className="p-4">Content 1</Card>
      </TabsContent>
      <TabsContent value="tab2" className="mt-4">
        <Card className="p-4">Content 2</Card>
      </TabsContent>
      <TabsContent value="tab3" className="mt-4">
        <Card className="p-4">Content 3</Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive tabs that adapt to screen size',
      },
    },
  },
};
