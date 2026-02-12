// Type declarations for react-big-calendar
declare module 'react-big-calendar' {
    import * as React from 'react';

    export interface Event {
        title: string;
        start: Date;
        end: Date;
        resource?: any;
        id?: string | number;
        allDay?: boolean;
        [key: string]: any;
    }

    export type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda';
    export type Navigate = 'PREV' | 'NEXT' | 'TODAY' | 'DATE';

    export interface CalendarProps {
        localizer: any;
        events?: Event[];
        startAccessor?: string | ((event: Event) => Date);
        endAccessor?: string | ((event: Event) => Date);
        titleAccessor?: string | ((event: Event) => string);
        allDayAccessor?: string | ((event: Event) => boolean);
        resourceAccessor?: string | ((event: Event) => any);
        views?: View[] | { [key: string]: boolean | React.ComponentType<any> };
        defaultView?: View;
        view?: View;
        date?: Date;
        onNavigate?: (date: Date, view: View, action: Navigate) => void;
        onView?: (view: View) => void;
        onSelectEvent?: (event: Event) => void;
        onSelectSlot?: (slotInfo: any) => void;
        onSelecting?: (range: any) => boolean | null;
        selectable?: boolean | 'ignoreEvents';
        step?: number;
        timeslots?: number;
        min?: Date;
        max?: Date;
        scrollToTime?: Date;
        enableAutoScroll?: boolean;
        style?: React.CSSProperties;
        className?: string;
        rtl?: boolean;
        components?: Record<string, any>;
        formats?: Record<string, any>;
        messages?: Record<string, any>;
        culture?: string;
        dayLayoutAlgorithm?: string | ((props: any) => any);
        [key: string]: any;
    }

    export class Calendar extends React.Component<CalendarProps> {}

    export function momentLocalizer(momentInstance: any): any;
    export function globalizeLocalizer(globalizeInstance: any): any;
    export function dateFnsLocalizer(config: any): any;
    export function luxonLocalizer(luxonInstance: any, options?: any): any;
}

declare module 'react-big-calendar/lib/css/react-big-calendar.css' {
    const content: any;
    export default content;
}
