import { Request, Response, NextFunction } from 'express';
interface RequestMetrics {
    path: string;
    method: string;
    statusCode: number;
    duration: number;
    timestamp: Date;
}
export declare function monitorRequests(req: Request, res: Response, next: NextFunction): void;
export declare function getMetrics(): RequestMetrics[];
export declare function getAverageResponseTime(): number;
export {};
//# sourceMappingURL=monitoring.d.ts.map