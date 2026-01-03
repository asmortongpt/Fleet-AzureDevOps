import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Truck, AlertTriangle, Fuel, Wrench } from 'lucide-react';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card with footer actions</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card includes footer actions.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const VehicleCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <div>
              <CardTitle>2023 Ford F-150</CardTitle>
              <CardDescription>VIN: 1FTFW1E89PKE12345</CardDescription>
            </div>
          </div>
          <Badge className="bg-green-500">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Mileage</p>
            <p className="font-medium">45,230 mi</p>
          </div>
          <div>
            <p className="text-muted-foreground">License</p>
            <p className="font-medium">ABC-1234</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fuel</p>
            <p className="font-medium">Diesel</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium text-green-600">Available</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  ),
};

export const MaintenanceAlertCard: Story = {
  render: () => (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>Maintenance Alert</CardTitle>
        </div>
        <CardDescription>Vehicle requires immediate attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium">2023 Toyota Camry - VIN: 4T1B11HK9KU123456</p>
          <p className="text-sm text-muted-foreground">
            Oil change due in 50 miles. Last service: 30 days ago.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          <Wrench className="mr-2 h-4 w-4" />
          Schedule Maintenance
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const MetricCard: Story = {
  render: () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
        <Truck className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">254</div>
        <p className="text-xs text-muted-foreground">+12% from last month</p>
      </CardContent>
    </Card>
  ),
};

export const FuelEfficiencyCard: Story = {
  render: () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Avg Fuel Efficiency</CardTitle>
        <Fuel className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">18.5 MPG</div>
        <p className="text-xs text-green-600">↑ 2.3% improvement</p>
      </CardContent>
    </Card>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">187</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">23</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Out of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">8</div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const InteractiveCard: Story = {
  render: () => (
    <Card className="cursor-pointer transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle>Click to expand</CardTitle>
        <CardDescription>This card is interactive</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Hover to see the shadow effect.</p>
      </CardContent>
    </Card>
  ),
};
