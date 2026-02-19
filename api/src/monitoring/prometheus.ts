/**
 * Prometheus Metrics Collection and Export
 * Provides comprehensive application metrics for monitoring and alerting
 */

import { register, Counter, Gauge, Histogram, Summary } from 'prom-client';
import logger from '../config/logger';

/**
 * Application metrics collector using Prometheus client
 */
class PrometheusMetrics {
  private initialized = false;

  // HTTP metrics
  private httpRequestDuration!: Histogram;
  private httpRequestTotal!: Counter;
  private httpRequestsInProgress!: Gauge;
  private httpErrorTotal!: Counter;

  // Database metrics
  private dbQueryDuration!: Histogram;
  private dbQueryTotal!: Counter;
  private dbConnectionPoolSize!: Gauge;
  private dbConnectionPoolUtilization!: Gauge;
  private dbQueryErrors!: Counter;

  // Business metrics
  private activeVehicles!: Gauge;
  private completedRoutes!: Counter;
  private driversOnline!: Gauge;
  private dispatchedOrders!: Counter;

  // Cache metrics
  private cacheHits!: Counter;
  private cacheMisses!: Counter;
  private cacheHitRate!: Gauge;

  // Job queue metrics
  private jobQueueSize!: Gauge;
  private jobsProcessed!: Counter;
  private jobsFailedTotal!: Counter;
  private jobDuration!: Histogram;

  // System metrics
  private processUptime!: Gauge;
  private processCpuUsageSeconds!: Counter;
  private processMemoryHeapBytes!: Gauge;
  private processMemoryHeapLimit!: Gauge;
  private processMemoryRssBytes!: Gauge;
  private gcDuration!: Histogram;

  // Custom application metrics
  private customMetrics: Map<string, Counter | Gauge | Histogram | Summary> = new Map();

  /**
   * Initialize Prometheus metrics
   */
  initialize(): void {
    if (this.initialized) {
      logger.info('Prometheus metrics already initialized');
      return;
    }

    try {
      // Clear default metrics if needed
      register.clear();

      // HTTP Metrics
      this.httpRequestDuration = new Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request latency in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
      });

      this.httpRequestTotal = new Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code']
      });

      this.httpRequestsInProgress = new Gauge({
        name: 'http_requests_in_progress',
        help: 'Number of HTTP requests currently being processed',
        labelNames: ['method', 'route']
      });

      this.httpErrorTotal = new Counter({
        name: 'http_errors_total',
        help: 'Total number of HTTP errors',
        labelNames: ['method', 'route', 'error_type']
      });

      // Database Metrics
      this.dbQueryDuration = new Histogram({
        name: 'db_query_duration_seconds',
        help: 'Database query latency in seconds',
        labelNames: ['query_type', 'table'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
      });

      this.dbQueryTotal = new Counter({
        name: 'db_queries_total',
        help: 'Total number of database queries',
        labelNames: ['query_type', 'table']
      });

      this.dbConnectionPoolSize = new Gauge({
        name: 'db_connection_pool_size',
        help: 'Size of the database connection pool',
        labelNames: ['pool_name']
      });

      this.dbConnectionPoolUtilization = new Gauge({
        name: 'db_connection_pool_utilization',
        help: 'Database connection pool utilization percentage',
        labelNames: ['pool_name']
      });

      this.dbQueryErrors = new Counter({
        name: 'db_query_errors_total',
        help: 'Total number of database query errors',
        labelNames: ['query_type', 'error_type']
      });

      // Business Metrics
      this.activeVehicles = new Gauge({
        name: 'fleet_active_vehicles',
        help: 'Number of active vehicles in the fleet'
      });

      this.completedRoutes = new Counter({
        name: 'fleet_completed_routes_total',
        help: 'Total number of completed routes'
      });

      this.driversOnline = new Gauge({
        name: 'fleet_drivers_online',
        help: 'Number of drivers currently online'
      });

      this.dispatchedOrders = new Counter({
        name: 'fleet_dispatched_orders_total',
        help: 'Total number of dispatched orders'
      });

      // Cache Metrics
      this.cacheHits = new Counter({
        name: 'cache_hits_total',
        help: 'Total number of cache hits',
        labelNames: ['cache_name']
      });

      this.cacheMisses = new Counter({
        name: 'cache_misses_total',
        help: 'Total number of cache misses',
        labelNames: ['cache_name']
      });

      this.cacheHitRate = new Gauge({
        name: 'cache_hit_rate',
        help: 'Cache hit rate percentage',
        labelNames: ['cache_name']
      });

      // Job Queue Metrics
      this.jobQueueSize = new Gauge({
        name: 'job_queue_size',
        help: 'Size of the job queue',
        labelNames: ['queue_name']
      });

      this.jobsProcessed = new Counter({
        name: 'jobs_processed_total',
        help: 'Total number of jobs processed',
        labelNames: ['queue_name', 'status']
      });

      this.jobsFailedTotal = new Counter({
        name: 'jobs_failed_total',
        help: 'Total number of failed jobs',
        labelNames: ['queue_name', 'error_type']
      });

      this.jobDuration = new Histogram({
        name: 'job_duration_seconds',
        help: 'Job processing duration in seconds',
        labelNames: ['queue_name'],
        buckets: [0.1, 0.5, 1, 5, 10, 30, 60]
      });

      // System Metrics
      this.processUptime = new Gauge({
        name: 'process_uptime_seconds',
        help: 'Application uptime in seconds'
      });

      this.processCpuUsageSeconds = new Counter({
        name: 'process_cpu_seconds_total',
        help: 'Total CPU time used by the process in seconds'
      });

      this.processMemoryHeapBytes = new Gauge({
        name: 'process_resident_memory_bytes',
        help: 'Resident memory in bytes'
      });

      this.processMemoryHeapLimit = new Gauge({
        name: 'nodejs_heap_size_limit_bytes',
        help: 'Node.js heap size limit in bytes'
      });

      this.processMemoryRssBytes = new Gauge({
        name: 'process_virtual_memory_bytes',
        help: 'Virtual memory in bytes'
      });

      this.gcDuration = new Histogram({
        name: 'gc_duration_seconds',
        help: 'Garbage collection duration in seconds',
        labelNames: ['gc_type'],
        buckets: [0.001, 0.01, 0.1, 1, 10]
      });

      this.initialized = true;
      logger.info('Prometheus metrics initialized successfully');

      // Start periodic metrics collection
      this.startMetricsCollection();
    } catch (error) {
      logger.error('Failed to initialize Prometheus metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Start periodic collection of system metrics
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      try {
        this.collectSystemMetrics();
      } catch (error) {
        logger.error('Error collecting system metrics', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 60000); // Every 60 seconds
  }

  /**
   * Collect system-level metrics
   */
  private collectSystemMetrics(): void {
    const uptime = process.uptime();
    this.processUptime.set(uptime);

    const memUsage = process.memoryUsage();
    this.processMemoryHeapBytes.set(memUsage.heapUsed);
    this.processMemoryHeapLimit.set(memUsage.heapTotal);
    this.processMemoryRssBytes.set(memUsage.rss);
  }

  // ============ HTTP Metrics ============

  /**
   * Track HTTP request
   */
  trackHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ): void {
    if (!this.initialized) return;

    try {
      this.httpRequestTotal.inc({ method, route, status_code: statusCode });
      this.httpRequestDuration.observe(
        { method, route, status_code: statusCode },
        duration / 1000 // Convert to seconds
      );

      if (statusCode >= 400) {
        this.httpErrorTotal.inc({
          method,
          route,
          error_type: statusCode >= 500 ? 'server_error' : 'client_error'
        });
      }
    } catch (error) {
      logger.error('Error tracking HTTP request', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Track HTTP request in progress
   */
  trackHttpRequestStart(method: string, route: string): void {
    if (!this.initialized) return;

    try {
      this.httpRequestsInProgress.inc({ method, route });
    } catch (error) {
      logger.error('Error tracking request start', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Track HTTP request completion
   */
  trackHttpRequestEnd(method: string, route: string): void {
    if (!this.initialized) return;

    try {
      this.httpRequestsInProgress.dec({ method, route });
    } catch (error) {
      logger.error('Error tracking request end', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ============ Database Metrics ============

  /**
   * Track database query
   */
  trackDbQuery(
    queryType: string,
    table: string,
    duration: number,
    success: boolean = true
  ): void {
    if (!this.initialized) return;

    try {
      this.dbQueryTotal.inc({ query_type: queryType, table });
      this.dbQueryDuration.observe(
        { query_type: queryType, table },
        duration / 1000 // Convert to seconds
      );

      if (!success) {
        this.dbQueryErrors.inc({ query_type: queryType, error_type: 'execution_error' });
      }
    } catch (error) {
      logger.error('Error tracking DB query', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Set database connection pool metrics
   */
  setDbConnectionPoolMetrics(
    poolName: string,
    size: number,
    utilization: number
  ): void {
    if (!this.initialized) return;

    try {
      this.dbConnectionPoolSize.set({ pool_name: poolName }, size);
      this.dbConnectionPoolUtilization.set({ pool_name: poolName }, utilization);
    } catch (error) {
      logger.error('Error setting DB pool metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ============ Business Metrics ============

  /**
   * Set active vehicles count
   */
  setActiveVehicles(count: number): void {
    if (!this.initialized) return;

    try {
      this.activeVehicles.set(count);
    } catch (error) {
      logger.error('Error setting active vehicles', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Increment completed routes
   */
  incCompletedRoutes(count: number = 1): void {
    if (!this.initialized) return;

    try {
      this.completedRoutes.inc(count);
    } catch (error) {
      logger.error('Error incrementing completed routes', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Set drivers online
   */
  setDriversOnline(count: number): void {
    if (!this.initialized) return;

    try {
      this.driversOnline.set(count);
    } catch (error) {
      logger.error('Error setting drivers online', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Increment dispatched orders
   */
  incDispatchedOrders(count: number = 1): void {
    if (!this.initialized) return;

    try {
      this.dispatchedOrders.inc(count);
    } catch (error) {
      logger.error('Error incrementing dispatched orders', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ============ Cache Metrics ============

  /**
   * Track cache hit
   */
  trackCacheHit(cacheName: string): void {
    if (!this.initialized) return;

    try {
      this.cacheHits.inc({ cache_name: cacheName });
      this.updateCacheHitRate(cacheName);
    } catch (error) {
      logger.error('Error tracking cache hit', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(cacheName: string): void {
    if (!this.initialized) return;

    try {
      this.cacheMisses.inc({ cache_name: cacheName });
      this.updateCacheHitRate(cacheName);
    } catch (error) {
      logger.error('Error tracking cache miss', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(cacheName: string): void {
    try {
      const hitMetric = this.cacheHits.get() as any;
      const missMetric = this.cacheMisses.get() as any;

      const hits = hitMetric?.values?.find(
        (v: any) => v.labels?.cache_name === cacheName
      )?.value ?? 0;
      const misses = missMetric?.values?.find(
        (v: any) => v.labels?.cache_name === cacheName
      )?.value ?? 0;

      const total = hits + misses;
      const rate = total > 0 ? (hits / total) * 100 : 0;

      this.cacheHitRate.set({ cache_name: cacheName }, rate);
    } catch (error) {
      // Silently fail - this is not critical
    }
  }

  // ============ Job Queue Metrics ============

  /**
   * Set job queue size
   */
  setJobQueueSize(queueName: string, size: number): void {
    if (!this.initialized) return;

    try {
      this.jobQueueSize.set({ queue_name: queueName }, size);
    } catch (error) {
      logger.error('Error setting job queue size', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Track job processing
   */
  trackJobProcessed(queueName: string, status: 'success' | 'failed', duration: number): void {
    if (!this.initialized) return;

    try {
      this.jobsProcessed.inc({ queue_name: queueName, status });
      this.jobDuration.observe({ queue_name: queueName }, duration / 1000);
    } catch (error) {
      logger.error('Error tracking job processed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Track job failure
   */
  trackJobFailed(queueName: string, errorType: string): void {
    if (!this.initialized) return;

    try {
      this.jobsFailedTotal.inc({ queue_name: queueName, error_type: errorType });
    } catch (error) {
      logger.error('Error tracking job failure', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ============ Metric Registration ============

  /**
   * Register a custom metric
   */
  registerCustomMetric(
    name: string,
    metric: Counter | Gauge | Histogram | Summary
  ): void {
    if (!this.initialized) return;

    try {
      this.customMetrics.set(name, metric);
    } catch (error) {
      logger.error('Error registering custom metric', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get metrics in Prometheus text format
   */
  async getMetrics(): Promise<string> {
    try {
      return await register.metrics();
    } catch (error) {
      logger.error('Error getting metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
      return '';
    }
  }

  /**
   * Get content type for metrics endpoint
   */
  getContentType(): string {
    return register.contentType;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    try {
      register.clear();
      this.initialized = false;
    } catch (error) {
      logger.error('Error clearing metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const prometheusMetrics = new PrometheusMetrics();

export default prometheusMetrics;
