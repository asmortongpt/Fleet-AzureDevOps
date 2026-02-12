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

const DefaultCalendar = () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    return (
        <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
        />
    )
}

export const Default: Story = {
    render: () => <DefaultCalendar />,
};

const MultipleMonthsCalendar = () => {
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
}

export const MultipleMonths: Story = {
    render: () => <MultipleMonthsCalendar />,
};

const RangeCalendar = () => {
    const defaultRange = {
        from: new Date(2023, 0, 20),
        to: new Date(2023, 0, 20 + 20),
    }

    return (
        <Calendar
            mode="range"
            defaultMonth={new Date(2023, 0, 20)}
            selected={defaultRange}
            className="rounded-md border"
            numberOfMonths={2}
        />
    )
}

export const Range: Story = {
    render: () => <RangeCalendar />
}
