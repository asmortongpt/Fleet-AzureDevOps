// Type declarations for web-vitals package
declare module 'web-vitals' {
    export type MetricType = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';

    export interface Metric {
        name: MetricType;
        value: number;
        rating: 'good' | 'needs-improvement' | 'poor';
        id: string;
        navigationType: string;
        delta: number;
        entries: PerformanceEntry[];
    }

    export interface ReportOpts {
        reportAllChanges?: boolean;
        durationThreshold?: number;
    }

    type MetricCallback = (metric: Metric) => void;

    export function onCLS(callback: MetricCallback, opts?: ReportOpts): void;
    export function onFID(callback: MetricCallback, opts?: ReportOpts): void;
    export function onFCP(callback: MetricCallback, opts?: ReportOpts): void;
    export function onLCP(callback: MetricCallback, opts?: ReportOpts): void;
    export function onTTFB(callback: MetricCallback, opts?: ReportOpts): void;
    export function onINP(callback: MetricCallback, opts?: ReportOpts): void;
}
