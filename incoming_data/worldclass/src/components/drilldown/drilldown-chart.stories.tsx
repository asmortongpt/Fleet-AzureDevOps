import type { Meta, StoryObj } from '@storybook/react';

import { DrilldownChart } from './DrilldownChart';

import { DrilldownProvider } from '@/contexts/DrilldownContext';

const meta = {
    title: 'Drilldown/DrilldownChart',
    component: DrilldownChart,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <DrilldownProvider>
                <div className="w-[800px] p-6 bg-background">
                    <Story />
                </div>
            </DrilldownProvider>
        ),
    ],
} satisfies Meta<typeof DrilldownChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
    { name: 'Tesla Model 3', count: 45 },
    { name: 'Ford F-150', count: 32 },
    { name: 'Rivian R1T', count: 18 },
    { name: 'Chevy Bolt', count: 12 },
    { name: 'Nissan Leaf', count: 8 },
];

export const BarVariant: Story = {
    args: {
        title: 'Fleet Composition by Model',
        data: sampleData,
        type: 'bar',
        dataKey: 'count',
        categoryKey: 'name',
        drilldownType: 'vehicle-list',
        unit: ' units',
    },
};

export const PieVariant: Story = {
    args: {
        title: 'Fleet Composition Share',
        data: sampleData,
        type: 'pie',
        dataKey: 'count',
        categoryKey: 'name',
        drilldownType: 'vehicle-list',
    },
};

export const CustomColors: Story = {
    args: {
        title: 'Status Distribution',
        data: [
            { status: 'Active', value: 85 },
            { status: 'Maintenance', value: 10 },
            { status: 'Inactive', value: 5 },
        ],
        type: 'pie',
        dataKey: 'value',
        categoryKey: 'status',
        drilldownType: 'status-details',
        colors: ['#22c55e', '#f59e0b', '#ef4444'], // Green, Amber, Red
    },
};
