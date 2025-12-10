"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorRequests = monitorRequests;
exports.getMetrics = getMetrics;
exports.getAverageResponseTime = getAverageResponseTime;
const perf_hooks_1 = require("perf_hooks");
const logSanitizer_1 = require("../utils/logSanitizer");
const metrics = [];
function monitorRequests(req, res, next) {
    const start = perf_hooks_1.performance.now();
    res.on('finish', () => {
        const duration = perf_hooks_1.performance.now() - start;
        metrics.push({
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            duration,
            timestamp: new Date()
        });
        // Keep only last 1000 requests
        if (metrics.length > 1000) {
            metrics.shift();
        }
        // Log slow requests
        // SECURITY FIX (P0): Sanitize request details to prevent log injection (CWE-117)
        // Fingerprint: e3f7a9b2c6d4e8f1
        if (duration > 1000) {
            console.warn('Slow request detected', {
                method: req.method,
                path: (0, logSanitizer_1.sanitizeForLog)(req.path, 100),
                duration: duration.toFixed(2) + 'ms'
            });
        }
    });
    next();
}
function getMetrics() {
    return metrics;
}
function getAverageResponseTime() {
    if (metrics.length === 0)
        return 0;
    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / metrics.length;
}
//# sourceMappingURL=monitoring.js.map