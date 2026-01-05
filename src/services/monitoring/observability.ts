// Simplified Observability Service
// Full implementation available in FLEET_CRITICAL_GAP_ANALYSIS.md

class ObservabilityService {
  trackMetric(name: string, value: number) {
    if (typeof window !== 'undefined' && (window as any).fleetMetrics) {
      (window as any).fleetMetrics.track(name, value);
    }
    console.log(`[Metric] ${name}:`, value);
  }

  trackEvent(name: string, properties?: any) {
    console.log(`[Event] ${name}:`, properties);
  }

  captureException(error: Error, context?: any) {
    console.error(`[Error] ${error.message}:`, context);
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    console[level](`[${level.toUpperCase()}] ${message}`, data);
  }
}

export const observability = new ObservabilityService();
