// Type declarations for moment library
declare module 'moment' {
    interface Moment {
        format(format?: string): string;
        toDate(): Date;
        add(amount?: number, unit?: string): Moment;
        subtract(amount?: number, unit?: string): Moment;
        isBefore(date?: any): boolean;
        isAfter(date?: any): boolean;
        clone(): Moment;
        valueOf(): number;
        [key: string]: any;
    }

    interface MomentInput {
        (inp?: any, format?: string | string[], strict?: boolean): Moment;
        (inp?: any, format?: string | string[], language?: string, strict?: boolean): Moment;
        locale(language?: string): string;
        utc(inp?: any, format?: string | string[], strict?: boolean): Moment;
        [key: string]: any;
    }

    const moment: MomentInput;
    export = moment;
}
