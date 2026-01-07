import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import { Calendar } from './calendar';

const meta: Meta<typeof Calendar> = {
    title: 'UI/Calendar',
    component: Calendar,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'A date picker component built on top of react-day-picker.',
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
    render: () => {
        const [date, setDate] = React.useState<Date | undefined>(new Date())

        return (
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
            />
        )
    },
};

export const MultipleMonths: Story = {
    render: () => {
        const [date, setDate] = React.useState<Date | undefined>(new Date())

        return (
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                numberOfMonths={2}
            />
        )
    },
};

export const Range: Story = {
    render: () => {
        // @ts-ignore
        const [date, setDate] = React.useState({
            from: new Date(2023, 0, 20),
            to: new Date(2023, 0, 20 + 20),
        })

        return (
            <Calendar
                mode="range"
                defaultMonth={new Date(2023, 0, 20)}
                selected={date}
                // @ts-ignore
                onSelect={setDate}
                className="rounded-md border"
                numberOfMonths={2}
            />
        )
    }
}
