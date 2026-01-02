# TO_BE_DESIGN.md - Route Optimization Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Status:** Approved for Development

---

## Executive Vision (120 lines)

### Strategic Transformation Goals

The enhanced route optimization module represents a paradigm shift in logistics management, moving from reactive to predictive and prescriptive logistics operations. Our vision is to create the world's most intelligent, adaptive, and user-centric route optimization platform that transforms how businesses manage their delivery operations.

**Core Transformation Objectives:**

1. **From Static to Dynamic Optimization:**
   - Replace batch processing with real-time continuous optimization
   - Implement adaptive algorithms that learn from every delivery
   - Enable instant rerouting based on live conditions (traffic, weather, vehicle status)

2. **From Cost-Centric to Customer-Centric:**
   - Shift focus from pure cost minimization to balanced optimization
   - Incorporate customer preferences (delivery windows, service levels)
   - Enable real-time customer communication and self-service adjustments

3. **From Siloed to Integrated Operations:**
   - Break down operational silos between dispatch, drivers, and customers
   - Create unified data platform connecting all logistics stakeholders
   - Enable cross-functional visibility and collaboration

4. **From Reactive to Predictive:**
   - Implement AI-driven demand forecasting
   - Develop predictive maintenance for vehicle fleets
   - Create early warning systems for potential disruptions

**Business Impact Metrics:**

| Metric | Current Baseline | 2.0 Target | Business Impact |
|--------|------------------|------------|-----------------|
| Delivery Cost per Mile | $1.85 | $1.20 | 35% reduction |
| On-Time Delivery Rate | 88% | 98% | 10% improvement |
| Fleet Utilization | 72% | 90% | 25% improvement |
| Customer Satisfaction | 4.2/5 | 4.8/5 | 15% improvement |
| Route Planning Time | 45 min | <1 min | 98% reduction |
| Fuel Consumption | 6.2 MPG | 7.8 MPG | 25% reduction |
| Driver Retention | 68% | 85% | 25% improvement |

### User Experience Revolution

**Driver Experience:**
- **Augmented Reality Navigation:** Overlay optimal routes on real-time camera feed with hazard warnings
- **Voice-Activated Controls:** Hands-free operation for safer driving
- **Predictive Fatigue Management:** AI monitors driving patterns and suggests breaks
- **Personalized Performance Feedback:** Gamified daily performance summaries

**Dispatcher Experience:**
- **AI-Assisted Decision Making:** Natural language query interface for complex scenarios
- **3D Route Visualization:** Interactive 3D map with terrain and traffic visualization
- **Automated Exception Handling:** AI suggests solutions for common issues
- **Collaborative Planning:** Shared workspace for team-based route optimization

**Customer Experience:**
- **Real-Time Tracking:** Live vehicle location with predictive ETA updates
- **Self-Service Adjustments:** Customers can modify delivery windows on-demand
- **Proactive Communication:** Automated notifications with delivery progress
- **Delivery Experience Feedback:** Integrated rating system with AI analysis

### Competitive Advantages

1. **Unmatched Intelligence:**
   - Hybrid AI combining deep learning, reinforcement learning, and traditional optimization
   - Continuous learning from every delivery across all customers
   - Predictive capabilities that anticipate issues before they occur

2. **Real-Time Adaptability:**
   - Sub-second route recalculation for dynamic conditions
   - Multi-modal optimization (truck, drone, bike, public transit)
   - Automatic contingency planning for high-risk scenarios

3. **Comprehensive Integration:**
   - Native integration with 50+ logistics and business systems
   - Open API with pre-built connectors for common platforms
   - Unified data model that eliminates silos

4. **Operational Resilience:**
   - Built-in redundancy and failover mechanisms
   - Offline-first architecture with seamless synchronization
   - Disaster recovery with <5 minute RTO

5. **Sustainability Focus:**
   - Carbon footprint tracking and optimization
   - Eco-friendly route suggestions
   - Alternative fuel vehicle support

### Long-Term Roadmap (2024-2027)

**2024 Milestones:**
- Q1: Core real-time optimization engine (v2.0)
- Q2: AI-powered demand forecasting
- Q3: Autonomous vehicle integration framework
- Q4: Blockchain for delivery verification

**2025 Vision:**
- **Autonomous Dispatch:** AI handles 80% of routing decisions
- **Predictive Fleet Management:** Self-optimizing vehicle allocation
- **Global Optimization:** Multi-region, multi-timezone support
- **Carbon-Neutral Logistics:** Zero-emission route prioritization

**2026 Innovations:**
- **Quantum-Ready Algorithms:** Prepared for quantum computing
- **Neural Interface:** Brain-computer interface for dispatchers
- **Self-Healing Networks:** Autonomous issue resolution
- **Holographic Visualization:** 3D route planning with gesture control

**2027 Transformation:**
- **Fully Autonomous Logistics:** End-to-end AI-managed operations
- **Self-Optimizing Supply Chains:** Dynamic network reconfiguration
- **Predictive Commerce:** Route optimization based on predicted orders
- **Logistics-as-a-Service:** Consumption-based pricing model

### Implementation Strategy

**Phase 1: Foundation (Months 1-3)**
- Core architecture redesign
- Real-time data pipeline
- Basic AI/ML integration
- PWA foundation

**Phase 2: Intelligence (Months 4-6)**
- Advanced optimization algorithms
- Predictive capabilities
- Gamification system
- Advanced analytics

**Phase 3: Integration (Months 7-9)**
- Third-party integrations
- API ecosystem
- Security hardening
- Comprehensive testing

**Phase 4: Optimization (Months 10-12)**
- Performance tuning
- User experience refinement
- Deployment automation
- Monitoring and observability

**Success Metrics:**
- 99.99% system availability
- <500ms response time for 95% of requests
- 90% reduction in manual routing efforts
- 30% improvement in key performance indicators
- 95% user satisfaction score

---

## Performance Enhancements (320 lines)

### Redis Caching Layer (60 lines)

```typescript
import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger';
import { RouteOptimizationRequest, RouteOptimizationResponse } from '../types/route-types';
import { CacheConfig } from '../config/cache-config';

export class RouteOptimizationCache {
    private client: RedisClientType;
    private logger: Logger;
    private config: CacheConfig;
    private static instance: RouteOptimizationCache;

    private constructor() {
        this.config = CacheConfig.getInstance();
        this.logger = new Logger('RouteOptimizationCache');
        this.initializeClient();
    }

    public static getInstance(): RouteOptimizationCache {
        if (!RouteOptimizationCache.instance) {
            RouteOptimizationCache.instance = new RouteOptimizationCache();
        }
        return RouteOptimizationCache.instance;
    }

    private async initializeClient(): Promise<void> {
        try {
            this.client = createClient({
                url: this.config.redisUrl,
                socket: {
                    tls: this.config.useTls,
                    rejectUnauthorized: false
                },
                password: this.config.redisPassword
            });

            this.client.on('error', (err) => {
                this.logger.error('Redis client error', { error: err });
            });

            this.client.on('connect', () => {
                this.logger.info('Connected to Redis server');
            });

            await this.client.connect();
            await this.setupCacheIndices();
        } catch (error) {
            this.logger.error('Failed to initialize Redis client', { error });
            throw error;
        }
    }

    private async setupCacheIndices(): Promise<void> {
        try {
            // Create index for route optimization requests
            await this.client.ft.create(
                'idx:route_requests',
                {
                    '$.requestId': {
                        type: 'TAG',
                        AS: 'requestId'
                    },
                    '$.vehicleId': {
                        type: 'TAG',
                        AS: 'vehicleId'
                    },
                    '$.depotId': {
                        type: 'TAG',
                        AS: 'depotId'
                    },
                    '$.timestamp': {
                        type: 'NUMERIC',
                        AS: 'timestamp'
                    },
                    '$.priority': {
                        type: 'NUMERIC',
                        AS: 'priority'
                    }
                },
                {
                    ON: 'JSON',
                    PREFIX: 'route:request:'
                }
            );

            // Create index for route responses
            await this.client.ft.create(
                'idx:route_responses',
                {
                    '$.requestId': {
                        type: 'TAG',
                        AS: 'requestId'
                    },
                    '$.optimizationScore': {
                        type: 'NUMERIC',
                        AS: 'optimizationScore'
                    },
                    '$.distance': {
                        type: 'NUMERIC',
                        AS: 'distance'
                    },
                    '$.duration': {
                        type: 'NUMERIC',
                        AS: 'duration'
                    },
                    '$.createdAt': {
                        type: 'NUMERIC',
                        AS: 'createdAt'
                    }
                },
                {
                    ON: 'JSON',
                    PREFIX: 'route:response:'
                }
            );
        } catch (error) {
            // Index might already exist, which is fine
            if (error.message.includes('Index already exists')) {
                this.logger.info('Redis indices already exist');
            } else {
                this.logger.error('Failed to create Redis indices', { error });
            }
        }
    }

    public async cacheRouteRequest(request: RouteOptimizationRequest): Promise<void> {
        try {
            const cacheKey = `route:request:${request.requestId}`;
            await this.client.json.set(cacheKey, '$', {
                ...request,
                timestamp: Date.now()
            });

            // Set TTL based on request priority
            const ttl = this.getRequestTtl(request.priority);
            await this.client.expire(cacheKey, ttl);
        } catch (error) {
            this.logger.error('Failed to cache route request', {
                requestId: request.requestId,
                error
            });
        }
    }

    public async cacheRouteResponse(response: RouteOptimizationResponse): Promise<void> {
        try {
            const cacheKey = `route:response:${response.requestId}`;
            await this.client.json.set(cacheKey, '$', {
                ...response,
                createdAt: Date.now()
            });

            // Set TTL based on response importance
            const ttl = this.getResponseTtl(response.optimizationScore);
            await this.client.expire(cacheKey, ttl);
        } catch (error) {
            this.logger.error('Failed to cache route response', {
                requestId: response.requestId,
                error
            });
        }
    }

    public async getCachedRouteResponse(requestId: string): Promise<RouteOptimizationResponse | null> {
        try {
            const cacheKey = `route:response:${requestId}`;
            const cachedResponse = await this.client.json.get(cacheKey);

            if (cachedResponse) {
                this.logger.info('Cache hit for route response', { requestId });
                return cachedResponse as RouteOptimizationResponse;
            }

            this.logger.info('Cache miss for route response', { requestId });
            return null;
        } catch (error) {
            this.logger.error('Failed to retrieve cached route response', {
                requestId,
                error
            });
            return null;
        }
    }

    public async getCachedRouteRequest(requestId: string): Promise<RouteOptimizationRequest | null> {
        try {
            const cacheKey = `route:request:${requestId}`;
            const cachedRequest = await this.client.json.get(cacheKey);

            if (cachedRequest) {
                this.logger.info('Cache hit for route request', { requestId });
                return cachedRequest as RouteOptimizationRequest;
            }

            this.logger.info('Cache miss for route request', { requestId });
            return null;
        } catch (error) {
            this.logger.error('Failed to retrieve cached route request', {
                requestId,
                error
            });
            return null;
        }
    }

    public async invalidateRouteCache(requestId: string): Promise<void> {
        try {
            const requestKey = `route:request:${requestId}`;
            const responseKey = `route:response:${requestId}`;

            await this.client.del(requestKey);
            await this.client.del(responseKey);

            this.logger.info('Invalidated route cache', { requestId });
        } catch (error) {
            this.logger.error('Failed to invalidate route cache', {
                requestId,
                error
            });
        }
    }

    public async searchCachedRequests(query: {
        vehicleId?: string;
        depotId?: string;
        priority?: number;
        from?: number;
        to?: number;
    }): Promise<RouteOptimizationRequest[]> {
        try {
            let searchQuery = '';

            if (query.vehicleId) {
                searchQuery += `@vehicleId:{${query.vehicleId}} `;
            }

            if (query.depotId) {
                searchQuery += `@depotId:{${query.depotId}} `;
            }

            if (query.priority) {
                searchQuery += `@priority:[${query.priority} ${query.priority}] `;
            }

            if (query.from && query.to) {
                searchQuery += `@timestamp:[${query.from} ${query.to}] `;
            } else if (query.from) {
                searchQuery += `@timestamp:[${query.from} +inf] `;
            } else if (query.to) {
                searchQuery += `@timestamp:[-inf ${query.to}] `;
            }

            if (!searchQuery.trim()) {
                return [];
            }

            const results = await this.client.ft.search(
                'idx:route_requests',
                searchQuery.trim(),
                {
                    LIMIT: { from: 0, size: 100 }
                }
            );

            return results.documents.map(doc => doc.value as RouteOptimizationRequest);
        } catch (error) {
            this.logger.error('Failed to search cached requests', { error });
            return [];
        }
    }

    private getRequestTtl(priority: number): number {
        // Higher priority requests have longer TTL
        if (priority >= 9) return 60 * 60 * 24 * 7; // 1 week
        if (priority >= 7) return 60 * 60 * 24 * 3; // 3 days
        if (priority >= 5) return 60 * 60 * 24; // 1 day
        if (priority >= 3) return 60 * 60 * 12; // 12 hours
        return 60 * 60 * 6; // 6 hours
    }

    private getResponseTtl(optimizationScore: number): number {
        // Higher optimization scores have longer TTL
        if (optimizationScore >= 0.95) return 60 * 60 * 24 * 7; // 1 week
        if (optimizationScore >= 0.9) return 60 * 60 * 24 * 3; // 3 days
        if (optimizationScore >= 0.8) return 60 * 60 * 24; // 1 day
        if (optimizationScore >= 0.7) return 60 * 60 * 12; // 12 hours
        return 60 * 60 * 6; // 6 hours
    }

    public async close(): Promise<void> {
        try {
            await this.client.quit();
            this.logger.info('Redis connection closed');
        } catch (error) {
            this.logger.error('Failed to close Redis connection', { error });
        }
    }
}
```

### Database Query Optimization (60 lines)

```typescript
import { Pool, PoolClient, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { RouteOptimizationRequest, RouteOptimizationResponse } from '../types/route-types';
import { DatabaseConfig } from '../config/database-config';

export class RouteOptimizationRepository {
    private pool: Pool;
    private logger: Logger;
    private static instance: RouteOptimizationRepository;

    private constructor() {
        const config = DatabaseConfig.getInstance();
        this.logger = new Logger('RouteOptimizationRepository');

        this.pool = new Pool({
            user: config.dbUser,
            host: config.dbHost,
            database: config.dbName,
            password: config.dbPassword,
            port: config.dbPort,
            max: config.maxConnections,
            idleTimeoutMillis: config.idleTimeout,
            connectionTimeoutMillis: config.connectionTimeout,
            ssl: config.useSsl ? {
                rejectUnauthorized: false
            } : false
        });

        this.pool.on('error', (err) => {
            this.logger.error('Unexpected error on idle client', { error: err });
        });

        this.initializeDatabase();
    }

    public static getInstance(): RouteOptimizationRepository {
        if (!RouteOptimizationRepository.instance) {
            RouteOptimizationRepository.instance = new RouteOptimizationRepository();
        }
        return RouteOptimizationRepository.instance;
    }

    private async initializeDatabase(): Promise<void> {
        try {
            await this.createTables();
            await this.createIndexes();
            await this.createMaterializedViews();
        } catch (error) {
            this.logger.error('Failed to initialize database', { error });
            throw error;
        }
    }

    private async createTables(): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Create route optimization requests table
            await client.query(`
                CREATE TABLE IF NOT EXISTS route_optimization_requests (
                    request_id VARCHAR(36) PRIMARY KEY,
                    vehicle_id VARCHAR(36) NOT NULL,
                    depot_id VARCHAR(36) NOT NULL,
                    priority INTEGER NOT NULL,
                    constraints JSONB NOT NULL,
                    delivery_locations JSONB NOT NULL,
                    time_windows JSONB NOT NULL,
                    vehicle_capacity JSONB NOT NULL,
                    special_requirements TEXT[],
                    status VARCHAR(20) NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    metadata JSONB
                );
            `);

            // Create route optimization responses table
            await client.query(`
                CREATE TABLE IF NOT EXISTS route_optimization_responses (
                    response_id VARCHAR(36) PRIMARY KEY,
                    request_id VARCHAR(36) NOT NULL REFERENCES route_optimization_requests(request_id),
                    optimization_score FLOAT NOT NULL,
                    distance FLOAT NOT NULL,
                    duration FLOAT NOT NULL,
                    route_sequence JSONB NOT NULL,
                    vehicle_load JSONB NOT NULL,
                    fuel_consumption FLOAT,
                    carbon_emissions FLOAT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    metadata JSONB
                );
            `);

            // Create route optimization events table
            await client.query(`
                CREATE TABLE IF NOT EXISTS route_optimization_events (
                    event_id VARCHAR(36) PRIMARY KEY,
                    request_id VARCHAR(36) REFERENCES route_optimization_requests(request_id),
                    event_type VARCHAR(50) NOT NULL,
                    event_data JSONB NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    metadata JSONB
                );
            `);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Failed to create tables', { error });
            throw error;
        } finally {
            client.release();
        }
    }

    private async createIndexes(): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Indexes for route_optimization_requests
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_route_requests_vehicle_id
                ON route_optimization_requests(vehicle_id);
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_route_requests_depot_id
                ON route_optimization_requests(depot_id);
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_route_requests_status
                ON route_optimization_requests(status);
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_route_requests_created_at
                ON route_optimization_requests(created_at);
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_route_requests_priority
                ON route_optimization_requests(priority);
            `);

            // Indexes for route_optimization_responses
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_route_responses_request_id
                ON route_optimization_responses(request_id);
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_route_responses_optimization_score
                ON route_optimization_responses(optimization_score);
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_route_responses_created_at
                ON route_optimization_responses(created_at);
            `);

            // GIN indexes for JSONB columns
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_route_requests_delivery_locations_gin
                ON route_optimization_requests USING GIN (delivery_locations);
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_route_responses_route_sequence_gin
                ON route_optimization_responses USING GIN (route_sequence);
            `);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Failed to create indexes', { error });
            throw error;
        } finally {
            client.release();
        }
    }

    private async createMaterializedViews(): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Create materialized view for route performance analytics
            await client.query(`
                CREATE MATERIALIZED VIEW IF NOT EXISTS mv_route_performance_analytics AS
                SELECT
                    r.vehicle_id,
                    r.depot_id,
                    COUNT(*) as total_requests,
                    AVG(res.optimization_score) as avg_optimization_score,
                    AVG(res.distance) as avg_distance,
                    AVG(res.duration) as avg_duration,
                    AVG(res.fuel_consumption) as avg_fuel_consumption,
                    DATE_TRUNC('day', r.created_at) as day
                FROM route_optimization_requests r
                JOIN route_optimization_responses res ON r.request_id = res.request_id
                GROUP BY r.vehicle_id, r.depot_id, DATE_TRUNC('day', r.created_at);
            `);

            // Create index on materialized view
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_mv_route_performance_analytics_day
                ON mv_route_performance_analytics(day);
            `);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Failed to create materialized views', { error });
            throw error;
        } finally {
            client.release();
        }
    }

    public async saveRouteRequest(request: RouteOptimizationRequest): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO route_optimization_requests (
                    request_id, vehicle_id, depot_id, priority, constraints,
                    delivery_locations, time_windows, vehicle_capacity,
                    special_requirements, status, created_at, updated_at, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (request_id) DO UPDATE SET
                    vehicle_id = EXCLUDED.vehicle_id,
                    depot_id = EXCLUDED.depot_id,
                    priority = EXCLUDED.priority,
                    constraints = EXCLUDED.constraints,
                    delivery_locations = EXCLUDED.delivery_locations,
                    time_windows = EXCLUDED.time_windows,
                    vehicle_capacity = EXCLUDED.vehicle_capacity,
                    special_requirements = EXCLUDED.special_requirements,
                    status = EXCLUDED.status,
                    updated_at = EXCLUDED.updated_at,
                    metadata = EXCLUDED.metadata
            `;

            const values = [
                request.requestId,
                request.vehicleId,
                request.depotId,
                request.priority,
                request.constraints,
                request.deliveryLocations,
                request.timeWindows,
                request.vehicleCapacity,
                request.specialRequirements || [],
                request.status,
                request.createdAt || new Date(),
                new Date(),
                request.metadata || {}
            ];

            await client.query(query, values);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Failed to save route request', {
                requestId: request.requestId,
                error
            });
            throw error;
        } finally {
            client.release();
        }
    }

    public async saveRouteResponse(response: RouteOptimizationResponse): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO route_optimization_responses (
                    response_id, request_id, optimization_score, distance,
                    duration, route_sequence, vehicle_load, fuel_consumption,
                    carbon_emissions, created_at, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (response_id) DO UPDATE SET
                    request_id = EXCLUDED.request_id,
                    optimization_score = EXCLUDED.optimization_score,
                    distance = EXCLUDED.distance,
                    duration = EXCLUDED.duration,
                    route_sequence = EXCLUDED.route_sequence,
                    vehicle_load = EXCLUDED.vehicle_load,
                    fuel_consumption = EXCLUDED.fuel_consumption,
                    carbon_emissions = EXCLUDED.carbon_emissions,
                    created_at = EXCLUDED.created_at,
                    metadata = EXCLUDED.metadata
            `;

            const values = [
                response.responseId,
                response.requestId,
                response.optimizationScore,
                response.distance,
                response.duration,
                response.routeSequence,
                response.vehicleLoad,
                response.fuelConsumption,
                response.carbonEmissions,
                response.createdAt || new Date(),
                response.metadata || {}
            ];

            await client.query(query, values);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Failed to save route response', {
                responseId: response.responseId,
                error
            });
            throw error;
        } finally {
            client.release();
        }
    }

    public async getRouteRequest(requestId: string): Promise<RouteOptimizationRequest | null> {
        const client = await this.pool.connect();

        try {
            const query = `
                SELECT * FROM route_optimization_requests
                WHERE request_id = $1
                LIMIT 1
            `;

            const result = await client.query(query, [requestId]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRequestRow(result.rows[0]);
        } catch (error) {
            this.logger.error('Failed to get route request', {
                requestId,
                error
            });
            throw error;
        } finally {
            client.release();
        }
    }

    public async getRouteResponse(requestId: string): Promise<RouteOptimizationResponse | null> {
        const client = await this.pool.connect();

        try {
            const query = `
                SELECT * FROM route_optimization_responses
                WHERE request_id = $1
                ORDER BY created_at DESC
                LIMIT 1
            `;

            const result = await client.query(query, [requestId]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapResponseRow(result.rows[0]);
        } catch (error) {
            this.logger.error('Failed to get route response', {
                requestId,
                error
            });
            throw error;
        } finally {
            client.release();
        }
    }

    public async getVehicleRouteHistory(vehicleId: string, limit: number = 100): Promise<RouteOptimizationResponse[]> {
        const client = await this.pool.connect();

        try {
            const query = `
                SELECT res.* FROM route_optimization_responses res
                JOIN route_optimization_requests req ON res.request_id = req.request_id
                WHERE req.vehicle_id = $1
                ORDER BY res.created_at DESC
                LIMIT $2
            `;

            const result = await client.query(query, [vehicleId, limit]);

            return result.rows.map(row => this.mapResponseRow(row));
        } catch (error) {
            this.logger.error('Failed to get vehicle route history', {
                vehicleId,
                error
            });
            throw error;
        } finally {
            client.release();
        }
    }

    public async getRoutePerformanceAnalytics(
        vehicleId?: string,
        depotId?: string,
        fromDate?: Date,
        toDate?: Date
    ): Promise<any> {
        const client = await this.pool.connect();

        try {
            let query = `
                SELECT * FROM mv_route_performance_analytics
                WHERE 1=1
            `;

            const params: any[] = [];
            let paramIndex = 1;

            if (vehicleId) {
                query += ` AND vehicle_id = $${paramIndex}`;
                params.push(vehicleId);
                paramIndex++;
            }

            if (depotId) {
                query += ` AND depot_id = $${paramIndex}`;
                params.push(depotId);
                paramIndex++;
            }

            if (fromDate) {
                query += ` AND day >= $${paramIndex}`;
                params.push(fromDate);
                paramIndex++;
            }

            if (toDate) {
                query += ` AND day <= $${paramIndex}`;
                params.push(toDate);
            }

            query += ` ORDER BY day`;

            const result = await client.query(query, params);
            return result.rows;
        } catch (error) {
            this.logger.error('Failed to get route performance analytics', { error });
            throw error;
        } finally {
            client.release();
        }
    }

    public async refreshMaterializedViews(): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('REFRESH MATERIALIZED VIEW mv_route_performance_analytics');
            this.logger.info('Refreshed materialized views');
        } catch (error) {
            this.logger.error('Failed to refresh materialized views', { error });
            throw error;
        } finally {
            client.release();
        }
    }

    private mapRequestRow(row: any): RouteOptimizationRequest {
        return {
            requestId: row.request_id,
            vehicleId: row.vehicle_id,
            depotId: row.depot_id,
            priority: row.priority,
            constraints: row.constraints,
            deliveryLocations: row.delivery_locations,
            timeWindows: row.time_windows,
            vehicleCapacity: row.vehicle_capacity,
            specialRequirements: row.special_requirements,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            metadata: row.metadata
        };
    }

    private mapResponseRow(row: any): RouteOptimizationResponse {
        return {
            responseId: row.response_id,
            requestId: row.request_id,
            optimizationScore: row.optimization_score,
            distance: row.distance,
            duration: row.duration,
            routeSequence: row.route_sequence,
            vehicleLoad: row.vehicle_load,
            fuelConsumption: row.fuel_consumption,
            carbonEmissions: row.carbon_emissions,
            createdAt: row.created_at,
            metadata: row.metadata
        };
    }

    public async close(): Promise<void> {
        try {
            await this.pool.end();
            this.logger.info('Database connection pool closed');
        } catch (error) {
            this.logger.error('Failed to close database connection pool', { error });
            throw error;
        }
    }
}
```

### API Response Compression (40 lines)

```typescript
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { CompressionConfig } from '../config/compression-config';

export class ResponseCompressor {
    private logger: Logger;
    private config: CompressionConfig;

    constructor() {
        this.logger = new Logger('ResponseCompressor');
        this.config = CompressionConfig.getInstance();
    }

    public getMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
        return compression({
            level: this.config.compressionLevel,
            threshold: this.config.threshold,
            filter: this.shouldCompress.bind(this),
            strategy: this.config.strategy,
            chunkSize: this.config.chunkSize,
            windowBits: this.config.windowBits,
            memLevel: this.config.memLevel,
            flush: this.config.flush
        });
    }

    private shouldCompress(req: Request, res: Response): boolean {
        // Don't compress responses if the client doesn't support it
        if (req.headers['x-no-compression']) {
            return false;
        }

        // Don't compress if the response is already compressed
        if (res.getHeader('Content-Encoding')) {
            return false;
        }

        // Only compress certain content types
        const contentType = res.getHeader('Content-Type') as string;
        if (contentType && !this.isCompressibleContentType(contentType)) {
            return false;
        }

        // Don't compress small responses
        if (Number(res.getHeader('Content-Length')) < this.config.minSize) {
            return false;
        }

        return true;
    }

    private isCompressibleContentType(contentType: string): boolean {
        return this.config.compressibleContentTypes.some(type =>
            contentType.startsWith(type)
        );
    }

    public async compressResponse(
        req: Request,
        res: Response,
        data: any,
        statusCode: number = 200
    ): Promise<void> {
        try {
            // Set appropriate headers
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = statusCode;

            // Check if client accepts gzip
            const acceptEncoding = req.headers['accept-encoding'] || '';
            const shouldCompress = acceptEncoding.includes('gzip') &&
                                 this.shouldCompress(req, res);

            if (shouldCompress) {
                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('Vary', 'Accept-Encoding');

                // Use the compression middleware's internal compression
                const compressionMiddleware = this.getMiddleware();
                const mockNext = () => {};

                // Temporarily replace res.end to capture the compressed data
                const originalEnd = res.end;
                let compressedData: Buffer;

                res.end = (chunk: any, encoding?: any, cb?: () => void) => {
                    if (chunk) {
                        compressedData = chunk;
                    }
                    return originalEnd.call(res, chunk, encoding, cb);
                };

                // Apply compression
                compressionMiddleware(req, res, mockNext);

                // Send the original data through the compression pipeline
                res.write(JSON.stringify(data));
                res.end();

                this.logger.debug('Response compressed successfully', {
                    requestId: req.headers['x-request-id'],
                    originalSize: JSON.stringify(data).length,
                    compressedSize: compressedData ? compressedData.length : 0,
                    compressionRatio: compressedData ?
                        (1 - (compressedData.length / JSON.stringify(data).length)).toFixed(2) : 0
                });
            } else {
                res.json(data);
                this.logger.debug('Response not compressed', {
                    requestId: req.headers['x-request-id'],
                    reason: !acceptEncoding.includes('gzip') ?
                        'Client does not accept gzip' : 'Response too small or wrong content type'
                });
            }
        } catch (error) {
            this.logger.error('Failed to compress response', {
                requestId: req.headers['x-request-id'],
                error
            });
            // Fallback to uncompressed response
            res.status(500).json({
                error: 'Internal server error',
                message: 'Response compression failed'
            });
        }
    }

    public async compressStream(
        req: Request,
        res: Response,
        stream: NodeJS.ReadableStream,
        contentType: string
    ): Promise<void> {
        try {
            const acceptEncoding = req.headers['accept-encoding'] || '';
            const shouldCompress = acceptEncoding.includes('gzip') &&
                                 this.isCompressibleContentType(contentType);

            res.setHeader('Content-Type', contentType);

            if (shouldCompress) {
                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('Vary', 'Accept-Encoding');

                const gzip = require('zlib').createGzip({
                    level: this.config.compressionLevel,
                    chunkSize: this.config.chunkSize
                });

                stream.pipe(gzip).pipe(res);

                this.logger.debug('Stream compression initiated', {
                    requestId: req.headers['x-request-id'],
                    contentType
                });
            } else {
                stream.pipe(res);
                this.logger.debug('Stream not compressed', {
                    requestId: req.headers['x-request-id'],
                    reason: !acceptEncoding.includes('gzip') ?
                        'Client does not accept gzip' : 'Content type not compressible'
                });
            }
        } catch (error) {
            this.logger.error('Failed to compress stream', {
                requestId: req.headers['x-request-id'],
                error
            });
            res.status(500).json({
                error: 'Internal server error',
                message: 'Stream compression failed'
            });
        }
    }
}
```

### Lazy Loading Implementation (50 lines)

```typescript
import { Logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance-monitor';

export class LazyLoader {
    private logger: Logger;
    private performanceMonitor: PerformanceMonitor;
    private static instance: LazyLoader;

    private constructor() {
        this.logger = new Logger('LazyLoader');
        this.performanceMonitor = PerformanceMonitor.getInstance();
    }

    public static getInstance(): LazyLoader {
        if (!LazyLoader.instance) {
            LazyLoader.instance = new LazyLoader();
        }
        return LazyLoader.instance;
    }

    public createLazyComponent<T>(
        loader: () => Promise<{ default: T }>,
        options: {
            fallback?: React.ReactNode;
            errorComponent?: React.ComponentType<{ error: Error }>;
            loadingComponent?: React.ComponentType;
            delay?: number;
            timeout?: number;
        } = {}
    ): React.ReactNode {
        const {
            fallback = null,
            errorComponent: ErrorComponent = DefaultErrorComponent,
            loadingComponent: LoadingComponent = DefaultLoadingComponent,
            delay = 200,
            timeout = 10000
        } = options;

        return React.createElement(LazyComponent, {
            loader,
            fallback,
            ErrorComponent,
            LoadingComponent,
            delay,
            timeout,
            logger: this.logger,
            performanceMonitor: this.performanceMonitor
        });
    }

    public createLazyRoute(
        path: string,
        loader: () => Promise<{ default: React.ComponentType }>,
        options: {
            exact?: boolean;
            sensitive?: boolean;
            strict?: boolean;
            fallback?: React.ReactNode;
            errorComponent?: React.ComponentType<{ error: Error }>;
            loadingComponent?: React.ComponentType;
        } = {}
    ): React.ReactNode {
        const {
            exact = false,
            sensitive = false,
            strict = false,
            fallback = null,
            errorComponent: ErrorComponent = DefaultErrorComponent,
            loadingComponent: LoadingComponent = DefaultLoadingComponent
        } = options;

        const LazyRouteComponent = this.createLazyComponent(loader, {
            fallback,
            errorComponent: ErrorComponent,
            loadingComponent: LoadingComponent
        });

        return React.createElement(Route, {
            path,
            exact,
            sensitive,
            strict,
            element: LazyRouteComponent
        });
    }

    public async loadWithRetry<T>(
        loader: () => Promise<T>,
        options: {
            maxRetries?: number;
            retryDelay?: number;
            timeout?: number;
        } = {}
    ): Promise<T> {
        const {
            maxRetries = 3,
            retryDelay = 1000,
            timeout = 30000
        } = options;

        const startTime = Date.now();
        let lastError: Error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Create a timeout promise
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Load timeout after ${timeout}ms`));
                    }, timeout);
                });

                // Race the loader against the timeout
                const result = await Promise.race([
                    loader(),
                    timeoutPromise
                ]);

                this.performanceMonitor.trackLazyLoad({
                    component: loader.name || 'anonymous',
                    attempt,
                    success: true,
                    duration: Date.now() - startTime
                });

                return result;
            } catch (error) {
                lastError = error;
                this.logger.warn(`Lazy load attempt ${attempt} failed`, {
                    error: error.message,
                    component: loader.name || 'anonymous',
                    attempt,
                    maxRetries
                });

                this.performanceMonitor.trackLazyLoad({
                    component: loader.name || 'anonymous',
                    attempt,
                    success: false,
                    duration: Date.now() - startTime,
                    error: error.message
                });

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        this.logger.error('All lazy load attempts failed', {
            component: loader.name || 'anonymous',
            maxRetries,
            lastError: lastError?.message
        });

        throw lastError || new Error('Lazy loading failed after all retries');
    }
}

interface LazyComponentProps<T> {
    loader: () => Promise<{ default: T }>;
    fallback?: React.ReactNode;
    ErrorComponent: React.ComponentType<{ error: Error }>;
    LoadingComponent: React.ComponentType;
    delay: number;
    timeout: number;
    logger: Logger;
    performanceMonitor: PerformanceMonitor;
}

interface LazyComponentState {
    Component: React.ComponentType | null;
    error: Error | null;
    isLoading: boolean;
    showLoading: boolean;
}

class LazyComponent<T> extends React.Component<LazyComponentProps<T>, LazyComponentState> {
    private timeoutId: NodeJS.Timeout | null = null;
    private delayTimeoutId: NodeJS.Timeout | null = null;
    private mounted: boolean = false;

    constructor(props: LazyComponentProps<T>) {
        super(props);
        this.state = {
            Component: null,
            error: null,
            isLoading: true,
            showLoading: false
        };
    }

    componentDidMount() {
        this.mounted = true;
        this.loadComponent();
    }

    componentWillUnmount() {
        this.mounted = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        if (this.delayTimeoutId) {
            clearTimeout(this.delayTimeoutId);
        }
    }

    async loadComponent() {
        try {
            // Set loading state after delay
            this.delayTimeoutId = setTimeout(() => {
                if (this.mounted) {
                    this.setState({ showLoading: true });
                }
            }, this.props.delay);

            // Set timeout for the load operation
            this.timeoutId = setTimeout(() => {
                if (this.mounted) {
                    this.setState({
                        error: new Error(`Component load timed out after ${this.props.timeout}ms`),
                        isLoading: false
                    });
                }
            }, this.props.timeout);

            const startTime = Date.now();
            const module = await this.props.loader();
            const duration = Date.now() - startTime;

            if (this.mounted) {
                clearTimeout(this.timeoutId!);
                clearTimeout(this.delayTimeoutId!);

                this.props.performanceMonitor.trackLazyLoad({
                    component: this.props.loader.name || 'anonymous',
                    attempt: 1,
                    success: true,
                    duration
                });

                this.setState({
                    Component: module.default,
                    isLoading: false,
                    showLoading: false
                });
            }
        } catch (error) {
            if (this.mounted) {
                clearTimeout(this.timeoutId!);
                clearTimeout(this.delayTimeoutId!);

                this.props.performanceMonitor.trackLazyLoad({
                    component: this.props.loader.name || 'anonymous',
                    attempt: 1,
                    success: false,
                    duration: Date.now() - (this.state.isLoading ? Date.now() : 0),
                    error: error.message
                });

                this.props.logger.error('Failed to load lazy component', {
                    component: this.props.loader.name || 'anonymous',
                    error: error.message
                });

                this.setState({
                    error: error,
                    isLoading: false,
                    showLoading: false
                });
            }
        }
    }

    render() {
        const { Component, error, isLoading, showLoading } = this.state;
        const { fallback, ErrorComponent, LoadingComponent } = this.props;

        if (error) {
            return React.createElement(ErrorComponent, { error });
        }

        if (Component) {
            return React.createElement(Component);
        }

        if (showLoading) {
            return React.createElement(LoadingComponent);
        }

        return fallback;
    }
}

const DefaultErrorComponent: React.ComponentType<{ error: Error }> = ({ error }) => (
    <div className="lazy-error">
        <h3>Error Loading Component</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
    </div>
);

const DefaultLoadingComponent: React.ComponentType = () => (
    <div className="lazy-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
    </div>
);
```

### Request Debouncing (40 lines)

```typescript
import { Logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance-monitor';

interface DebounceOptions {
    delay: number;
    maxWait?: number;
    leading?: boolean;
    trailing?: boolean;
}

interface DebouncedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): Promise<ReturnType<T>>;
    cancel: () => void;
    flush: () => Promise<ReturnType<T> | undefined>;
    pending: () => boolean;
}

export class Debouncer {
    private logger: Logger;
    private performanceMonitor: PerformanceMonitor;
    private static instance: Debouncer;

    private constructor() {
        this.logger = new Logger('Debouncer');
        this.performanceMonitor = PerformanceMonitor.getInstance();
    }

    public static getInstance(): Debouncer {
        if (!Debouncer.instance) {
            Debouncer.instance = new Debouncer();
        }
        return Debouncer.instance;
    }

    public debounce<T extends (...args: any[]) => any>(
        func: T,
        options: DebounceOptions = { delay: 300 }
    ): DebouncedFunction<T> {
        const {
            delay,
            maxWait = 0,
            leading = false,
            trailing = true
        } = options;

        let lastCallTime = 0;
        let lastInvokeTime = 0;
        let timerId: NodeJS.Timeout | null = null;
        let maxWaitTimerId: NodeJS.Timeout | null = null;
        let lastArgs: Parameters<T> | null = null;
        let lastThis: any;
        let result: ReturnType<T> | undefined;
        let promiseResolve: ((value: ReturnType<T>) => void) | null = null;
        let promiseReject: ((reason?: any) => void) | null = null;
        let pendingPromise: Promise<ReturnType<T>> | null = null;

        const invokeFunc = (time: number): ReturnType<T> => {
            const args = lastArgs!;
            const thisArg = lastThis;

            lastArgs = null;
            lastThis = null;
            lastInvokeTime = time;
            result = func.apply(thisArg, args);

            return result;
        };

        const startTimer = (pendingFunc: () => void, wait: number) => {
            if (timerId) {
                clearTimeout(timerId);
            }
            timerId = setTimeout(pendingFunc, wait);
        };

        const shouldInvoke = (time: number): boolean => {
            const timeSinceLastCall = time - lastCallTime;
            const timeSinceLastInvoke = time - lastInvokeTime;

            return (
                lastCallTime === 0 ||
                timeSinceLastCall >= delay ||
                timeSinceLastCall < 0 ||
                (maxWait > 0 && timeSinceLastInvoke >= maxWait)
            );
        };

        const trailingEdge = (time: number): ReturnType<T> => {
            if (trailing && lastArgs) {
                return invokeFunc(time);
            }
            lastArgs = null;
            lastThis = null;
            return result!;
        };

        const timerExpired = () => {
            const time = Date.now();
            if (shouldInvoke(time)) {
                return trailingEdge(time);
            }
            startTimer(timerExpired, delay - (time - lastCallTime));
            return result!;
        };

        const leadingEdge = (time: number): ReturnType<T> => {
            lastInvokeTime = time;
            startTimer(timerExpired, delay);

            if (leading) {
                return invokeFunc(time);
            }
            return result!;
        };

        const debounced = function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
            const time = Date.now();
            const isInvoking = shouldInvoke(time);

            lastArgs = args;
            lastThis = this;
            lastCallTime = time;

            if (isInvoking) {
                if (!lastInvokeTime && leading) {
                    return Promise.resolve(leadingEdge(time));
                }
                if (maxWait === 0) {
                    return Promise.resolve(trailingEdge(time));
                }
            }

            if (!pendingPromise) {
                pendingPromise = new Promise<ReturnType<T>>((resolve, reject) => {
                    promiseResolve = resolve;
                    promiseReject = reject;
                });
            }

            if (maxWait > 0 && !maxWaitTimerId) {
                maxWaitTimerId = setTimeout(() => {
                    const time = Date.now();
                    if (shouldInvoke(time)) {
                        const result = trailingEdge(time);
                        if (promiseResolve) {
                            promiseResolve(result);
                        }
                    }
                    cancel();
                }, maxWait);
            }

            if (!timerId) {
                startTimer(() => {
                    const time = Date.now();
                    if (shouldInvoke(time)) {
                        const result = trailingEdge(time);
                        if (promiseResolve) {
                            promiseResolve(result);
                        }
                    }
                    cancel();
                }, delay);
            }

            return pendingPromise;
        };

        debounced.cancel = () => {
            if (timerId) {
                clearTimeout(timerId);
            }
            if (maxWaitTimerId) {
                clearTimeout(maxWaitTimerId);
            }
            lastInvokeTime = 0;
            lastArgs = null;
            lastThis = null;
            lastCallTime = 0;
            timerId = null;
            maxWaitTimerId = null;

            if (promiseReject) {
                promiseReject(new Error('Debounced function cancelled'));
                promiseReject = null;
                promiseResolve = null;
                pendingPromise = null;
            }
        };

        debounced.flush = (): Promise<ReturnType<T> | undefined> => {
            if (timerId || maxWaitTimerId) {
                const time = Date.now();
                const result = trailingEdge(time);
                cancel();

                if (promiseResolve) {
                    promiseResolve(result);
                    promiseResolve = null;
                    promiseReject = null;
                    pendingPromise = null;
                }

                return Promise.resolve(result);
            }

            return Promise.resolve(result);
        };

        debounced.pending = (): boolean => {
            return timerId !== null || maxWaitTimerId !== null;
        };

        const cancel = debounced.cancel;

        this.performanceMonitor.trackDebounce({
            functionName: func.name || 'anonymous',
            delay,
            maxWait,
            leading,
            trailing
        });

        return debounced;
    }

    public async debounceAsync<T extends (...args: any[]) => Promise<any>>(
        func: T,
        options: DebounceOptions = { delay: 300 }
    ): Promise<DebouncedFunction<T>> {
        const debounced = this.debounce(func, options);

        return async function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
            try {
                const result = await debounced.apply(this, args);
                return result;
            } catch (error) {
                this.logger.error('Debounced async function failed', {
                    functionName: func.name || 'anonymous',
                    error: error.message
                });
                throw error;
            }
        } as DebouncedFunction<T>;
    }
}
```

### Connection Pooling (40 lines)

```typescript
import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { DatabaseConfig } from '../config/database-config';

interface ConnectionPoolMetrics {
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
    maxConnections: number;
    minConnections: number;
}

export class ConnectionPoolManager {
    private pool: Pool;
    private logger: Logger;
    private performanceMonitor: PerformanceMonitor;
    private config: DatabaseConfig;
    private static instance: ConnectionPoolManager;

    private constructor() {
        this.config = DatabaseConfig.getInstance();
        this.logger = new Logger('ConnectionPoolManager');
        this.performanceMonitor = PerformanceMonitor.getInstance();

        this.pool = this.createPool();
        this.setupEventListeners();
    }

    public static getInstance(): ConnectionPoolManager {
        if (!ConnectionPoolManager.instance) {
            ConnectionPoolManager.instance = new ConnectionPoolManager();
        }
        return ConnectionPoolManager.instance;
    }

    private createPool(): Pool {
        const poolConfig: PoolConfig = {
            user: this.config.dbUser,
            host: this.config.dbHost,
            database: this.config.dbName,
            password: this.config.dbPassword,
            port: this.config.dbPort,
            max: this.config.maxConnections,
            min: this.config.minConnections,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout,
            ssl: this.config.useSsl ? {
                rejectUnauthorized: false
            } : false,
            application_name: 'route-optimization-service',
            statement_timeout: this.config.statementTimeout,
            query_timeout: this.config.queryTimeout,
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000
        };

        return new Pool(poolConfig);
    }

    private setupEventListeners(): void {
        this.pool.on('connect', (client) => {
            this.logger.debug('New database connection established', {
                connectionId: client.processID
            });

            this.performanceMonitor.trackDatabaseConnection({
                event: 'connect',
                connectionId: client.processID,
                poolSize: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            });
        });

        this.pool.on('acquire', (client) => {
            this.logger.debug('Database connection acquired', {
                connectionId: client.processID
            });

            this.performanceMonitor.trackDatabaseConnection({
                event: 'acquire',
                connectionId: client.processID,
                poolSize: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            });
        });

        this.pool.on('remove', (client) => {
            this.logger.debug('Database connection removed', {
                connectionId: client.processID
            });

            this.performanceMonitor.trackDatabaseConnection({
                event: 'remove',
                connectionId: client.processID,
                poolSize: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            });
        });

        this.pool.on('error', (err, client) => {
            this.logger.error('Database connection error', {
                error: err.message,
                connectionId: client?.processID
            });

            this.performanceMonitor.trackDatabaseConnection({
                event: 'error',
                error: err.message,
                connectionId: client?.processID,
                poolSize: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            });
        });
    }

    public async getClient(): Promise<PoolClient> {
        const startTime = Date.now();

        try {
            const client = await this.pool.connect();

            this.performanceMonitor.trackDatabaseOperation({
                operation: 'getClient',
                duration: Date.now() - startTime,
                success: true,
                poolSize: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            });

            return client;
        } catch (error) {
            this.performanceMonitor.trackDatabaseOperation({
                operation: 'getClient',
                duration: Date.now() - startTime,
                success: false,
                error: error.message,
                poolSize: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            });

            this.logger.error('Failed to get database client', { error });
            throw error;
        }
    }

    public async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const startTime = Date.now();
        const client = await this.getClient();

        try {
            const result = await client.query<T>(text, params);

            this.performanceMonitor.trackDatabaseOperation({
                operation: 'query',
                query: text.substring(0, 100), // Log first 100 chars of query
                duration: Date.now() - startTime,
                success: true,
                rowCount: result.rowCount,
                poolSize: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            });

            return result;
        } catch (error) {
            this.performanceMonitor.trackDatabaseOperation({
                operation: 'query',
                query: text.substring(0, 100),
                duration: Date.now() - startTime,
                success: false,
                error: error.message,
                poolSize: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            });

            this.logger.error('Database query failed', {
                query: text.substring(0, 100),
                error: error.message
            });

            throw error;
        } finally {
            client.release();
        }
    }

    public async transaction<T>(
        callback: (client: PoolClient) => Promise<T>
    ): Promise<T> {
        const startTime = Date.now();
        const client = await this.getClient();

        try {
            await client.query('BEGIN');

            const result = await callback(client);

            await client.query('COMMIT');

            this.performanceMonitor.trackDatabaseOperation({
                operation: 'transaction',
                duration: Date.now() - startTime,
                success: true,
                poolSize: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            });

            return result;
        } catch (error) {
            await client.query('ROLLBACK');

            this.performanceMonitor.trackDatabaseOperation({
                operation: 'transaction',
                duration: Date.now() - startTime,
                success: false,
                error: error.message,
                poolSize: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            });

            this.logger.error('Database transaction failed', { error });
            throw error;
        } finally {
            client.release();
        }
    }

    public getPoolMetrics(): ConnectionPoolMetrics {
        return {
            totalConnections: this.pool.totalCount,
            idleConnections: this.pool.idleCount,
            waitingClients: this.pool.waitingCount,
            maxConnections: this.config.maxConnections,
            minConnections: this.config.minConnections
        };
    }

    public async resizePool(newSize: number): Promise<void> {
        if (newSize < 1) {
            throw new Error('Pool size must be at least 1');
        }

        this.logger.info('Resizing connection pool', {
            oldSize: this.config.maxConnections,
            newSize
        });

        this.config.maxConnections = newSize;
        this.pool.options.max = newSize;

        // The pool will automatically adjust to the new size
        // as connections are acquired and released
    }

    public async close(): Promise<void> {
        try {
            await this.pool.end();
            this.logger.info('Database connection pool closed');
        } catch (error) {
            this.logger.error('Failed to close database connection pool', { error });
            throw error;
        }
    }

    public async checkConnection(): Promise<boolean> {
        try {
            const client = await this.getClient();
            await client.query('SELECT 1');
            client.release();
            return true;
        } catch (error) {
            this.logger.error('Database connection check failed', { error });
            return false;
        }
    }

    public async getConnectionStats(): Promise<any> {
        const metrics = this.getPoolMetrics();

        return {
            ...metrics,
            utilization: metrics.totalConnections > 0 ?
                (metrics.totalConnections - metrics.idleConnections) / metrics.totalConnections : 0,
            waitTime: this.pool.waitingCount > 0 ?
                (Date.now() - this.pool._waiting[0].start) / 1000 : 0
        };
    }
}
```

---

## Real-Time Features (350 lines)

### WebSocket Server Setup (70 lines)

```typescript
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { WebSocketConfig } from '../config/websocket-config';
import { v4 as uuidv4 } from 'uuid';
import { RouteOptimizationService } from '../services/route-optimization-service';
import { AuthService } from '../services/auth-service';

interface WebSocketConnection {
    socket: WebSocket;
    userId: string;
    vehicleId?: string;
    depotId?: string;
    roles: string[];
    connectionId: string;
    ipAddress: string;
    userAgent: string;
    connectedAt: Date;
    lastPing: Date;
    isAlive: boolean;
}

export class WebSocketManager {
    private wss: WebSocketServer;
    private connections: Map<string, WebSocketConnection>;
    private logger: Logger;
    private performanceMonitor: PerformanceMonitor;
    private config: WebSocketConfig;
    private routeOptimizationService: RouteOptimizationService;
    private authService: AuthService;
    private pingInterval: NodeJS.Timeout;
    private static instance: WebSocketManager;

    private constructor() {
        this.config = WebSocketConfig.getInstance();
        this.logger = new Logger('WebSocketManager');
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.routeOptimizationService = RouteOptimizationService.getInstance();
        this.authService = AuthService.getInstance();
        this.connections = new Map();

        this.wss = new WebSocketServer({
            port: this.config.port,
            clientTracking: true,
            maxPayload: this.config.maxPayload,
            backlog: this.config.backlog,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024
                },
                threshold: 1024
            }
        });

        this.setupEventListeners();
        this.setupPingPong();
    }

    public static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    private setupEventListeners(): void {
        this.wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
            this.handleConnection(socket, request);
        });

        this.wss.on('error', (error: Error) => {
            this.logger.error('WebSocket server error', { error });
            this.performanceMonitor.trackWebSocketEvent({
                event: 'server_error',
                error: error.message
            });
        });

        this.wss.on('close', () => {
            this.logger.info('WebSocket server closed');
            this.performanceMonitor.trackWebSocketEvent({
                event: 'server_close'
            });
        });

        this.wss.on('listening', () => {
            this.logger.info('WebSocket server listening', {
                port: this.config.port,
                path: this.config.path
            });
            this.performanceMonitor.trackWebSocketEvent({
                event: 'server_listening',
                port: this.config.port
            });
        });
    }

    private setupPingPong(): void {
        this.pingInterval = setInterval(() => {
            this.wss.clients.forEach((socket) => {
                const connection = this.connections.get((socket as any).connectionId);

                if (connection) {
                    if (!connection.isAlive) {
                        this.terminateConnection(connection.connectionId, 'ping timeout');
                        return;
                    }

                    connection.isAlive = false;
                    socket.ping();

                    this.performanceMonitor.trackWebSocketEvent({
                        event: 'ping_sent',
                        connectionId: connection.connectionId,
                        userId: connection.userId
                    });
                }
            });
        }, this.config.pingInterval);
    }

    private async handleConnection(socket: WebSocket, request: IncomingMessage): Promise<void> {
        try {
            const connectionId = uuidv4();
            (socket as any).connectionId = connectionId;

            const ipAddress = request.socket.remoteAddress || 'unknown';
            const userAgent = request.headers['user-agent'] || 'unknown';

            this.logger.info('New WebSocket connection', {
                connectionId,
                ipAddress,
                userAgent
            });

            // Extract and validate token
            const token = this.extractToken(request);
            if (!token) {
                this.terminateConnection(connectionId, 'no token provided');
                return;
            }

            const authResult = await this.authService.validateToken(token);
            if (!authResult.valid) {
                this.terminateConnection(connectionId, 'invalid token');
                return;
            }

            const connection: WebSocketConnection = {
                socket,
                userId: authResult.userId,
                vehicleId: authResult.vehicleId,
                depotId: authResult.depotId,
                roles: authResult.roles,
                connectionId,
                ipAddress,
                userAgent,
                connectedAt: new Date(),
                lastPing: new Date(),
                isAlive: true
            };

            this.connections.set(connectionId, connection);

            this.setupSocketEventListeners(socket, connection);

            this.sendWelcomeMessage(connection);

            this.performanceMonitor.trackWebSocketEvent({
                event: 'connection_established',
                connectionId,
                userId: connection.userId,
                roles: connection.roles,
                ipAddress,
                userAgent
            });

            this.logger.info('WebSocket connection authenticated', {
                connectionId,
                userId: connection.userId,
                roles: connection.roles
            });
        } catch (error) {
            this.logger.error('WebSocket connection failed', {
                error: error.message,
                ipAddress: request.socket.remoteAddress
            });
            this.performanceMonitor.trackWebSocketEvent({
                event: 'connection_failed',
                error: error.message,
                ipAddress: request.socket.remoteAddress
            });
        }
    }

    private extractToken(request: IncomingMessage): string | null {
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }

    private setupSocketEventListeners(socket: WebSocket, connection: WebSocketConnection): void {
        socket.on('message', (data: WebSocket.RawData) => {
            this.handleMessage(connection, data);
        });

        socket.on('pong', () => {
            connection.isAlive = true;
            connection.lastPing = new Date();

            this.performanceMonitor.trackWebSocketEvent({
                event: 'pong_received',
                connectionId: connection.connectionId,
                userId: connection.userId
            });
        });

        socket.on('close', (code: number, reason: Buffer) => {
            this.handleClose(connection, code, reason);
        });

        socket.on('error', (error: Error) => {
            this.handleError(connection, error);
        });
    }

    private sendWelcomeMessage(connection: WebSocketConnection): void {
        const welcomeMessage = {
            type: 'welcome',
            connectionId: connection.connectionId,
            timestamp: new Date().toISOString(),
            userId: connection.userId,
            roles: connection.roles,
            serverVersion: process.env.APP_VERSION || '1.0.0',
            supportedProtocols: ['route_optimization', 'vehicle_tracking', 'notification']
        };

        this.sendMessage(connection, welcomeMessage);
    }

    public sendMessage(connection: WebSocketConnection, message: any): void {
        try {
            if (connection.socket.readyState === WebSocket.OPEN) {
                const messageString = JSON.stringify(message);
                connection.socket.send(messageString);

                this.performanceMonitor.trackWebSocketEvent({
                    event: 'message_sent',
                    connectionId: connection.connectionId,
                    userId: connection.userId,
                    messageType: message.type,
                    messageSize: messageString.length
                });
            }
        } catch (error) {
            this.logger.error('Failed to send WebSocket message', {
                connectionId: connection.connectionId,
                error: error.message,
                messageType: message.type
            });

            this.performanceMonitor.trackWebSocketEvent({
                event: 'message_send_failed',
                connectionId: connection.connectionId,
                error: error.message,
                messageType: message.type
            });
        }
    }

    public broadcast(message: any, filter?: (connection: WebSocketConnection) => boolean): void {
        const messageString = JSON.stringify(message);
        let sentCount = 0;

        this.connections.forEach((connection) => {
            if (connection.socket.readyState === WebSocket.OPEN) {
                if (!filter || filter(connection)) {
                    try {
                        connection.socket.send(messageString);
                        sentCount++;

                        this.performanceMonitor.trackWebSocketEvent({
                            event: 'broadcast_sent',
                            connectionId: connection.connectionId,
                            userId: connection.userId,
                            messageType: message.type,
                            messageSize: messageString.length
                        });
                    } catch (error) {
                        this.logger.error('Failed to broadcast WebSocket message', {
                            connectionId: connection.connectionId,
                            error: error.message,
                            messageType: message.type
                        });
                    }
                }
            }
        });

        this.logger.debug('Broadcast message sent', {
            messageType: message.type,
            sentCount,
            totalConnections: this.connections.size
        });
    }

    public async close(): Promise<void> {
        try {
            clearInterval(this.pingInterval);

            this.wss.clients.forEach((socket) => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.close(1001, 'Server shutting down');
                }
            });

            await new Promise<void>((resolve) => {
                this.wss.close(() => {
                    this.logger.info('WebSocket server closed gracefully');
                    resolve();
                });
            });
        } catch (error) {
            this.logger.error('Failed to close WebSocket server', { error });
            throw error;
        }
    }

    public getConnectionCount(): number {
        return this.connections.size;
    }

    public getConnections(): WebSocketConnection[] {
        return Array.from(this.connections.values());
    }

    public getConnection(connectionId: string): WebSocketConnection | undefined {
        return this.connections.get(connectionId);
    }

    public getConnectionsByUserId(userId: string): WebSocketConnection[] {
        return this.getConnections().filter(conn => conn.userId === userId);
    }

    public getConnectionsByVehicleId(vehicleId: string): WebSocketConnection[] {
        return this.getConnections().filter(conn => conn.vehicleId === vehicleId);
    }

    public getConnectionsByDepotId(depotId: string): WebSocketConnection[] {
        return this.getConnections().filter(conn => conn.depotId === depotId);
    }

    private terminateConnection(connectionId: string, reason: string): void {
        const connection = this.connections.get(connectionId);
        if (connection) {
            try {
                connection.socket.close(1008, reason);
                this.connections.delete(connectionId);

                this.logger.info('WebSocket connection terminated', {
                    connectionId,
                    reason,
                    userId: connection.userId
                });

                this.performanceMonitor.trackWebSocketEvent({
                    event: 'connection_terminated',
                    connectionId,
                    userId: connection.userId,
                    reason
                });
            } catch (error) {
                this.logger.error('Failed to terminate WebSocket connection', {
                    connectionId,
                    error: error.message
                });
            }
        }
    }
}
```

### Real-Time Event Handlers (90 lines)

```typescript
import { WebSocketConnection } from './websocket-manager';
import { Logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { RouteOptimizationService } from '../services/route-optimization-service';
import { VehicleTrackingService } from '../services/vehicle-tracking-service';
import { NotificationService } from '../services/notification-service';
import {
    RouteOptimizationRequest,
    RouteOptimizationResponse,
    RouteEvent,
    VehicleLocationUpdate,
    NotificationMessage
} from '../types/route-types';

export class WebSocketEventHandler {
    private logger: Logger;
    private performanceMonitor: PerformanceMonitor;
    private routeOptimizationService: RouteOptimizationService;
    private vehicleTrackingService: VehicleTrackingService;
    private notificationService: NotificationService;
    private static instance: WebSocketEventHandler;

    private constructor() {
        this.logger = new Logger('WebSocketEventHandler');
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.routeOptimizationService = RouteOptimizationService.getInstance();
        this.vehicleTrackingService = VehicleTrackingService.getInstance();
        this.notificationService = NotificationService.getInstance();
    }

    public static getInstance(): WebSocketEventHandler {
        if (!WebSocketEventHandler.instance) {
            WebSocketEventHandler.instance = new WebSocketEventHandler();
        }
        return WebSocketEventHandler.instance;
    }

    public async handleMessage(connection: WebSocketConnection, data: WebSocket.RawData): Promise<void> {
        try {
            const message = this.parseMessage(data);
            if (!message) {
                this.logger.warn('Received invalid WebSocket message', {
                    connectionId: connection.connectionId,
                    data: data.toString()
                });
                return;
            }

            this.performanceMonitor.trackWebSocketEvent({
                event: 'message_received',
                connectionId: connection.connectionId,
                userId: connection.userId,
                messageType: message.type,
                messageSize: data.length
            });

            switch (message.type) {
                case 'route_optimization_request':
                    await this.handleRouteOptimizationRequest(connection, message);
                    break;
                case 'route_optimization_cancel':
                    await this.handleRouteOptimizationCancel(connection, message);
                    break;
                case 'vehicle_location_update':
                    await this.handleVehicleLocationUpdate(connection, message);
                    break;
                case 'route_event':
                    await this.handleRouteEvent(connection, message);
                    break;
                case 'route_status_subscription':
                    await this.handleRouteStatusSubscription(connection, message);
                    break;
                case 'vehicle_status_subscription':
                    await this.handleVehicleStatusSubscription(connection, message);
                    break;
                case 'notification_subscription':
                    await this.handleNotificationSubscription(connection, message);
                    break;
                case 'ping':
                    this.handlePing(connection);
                    break;
                default:
                    this.logger.warn('Received unknown message type', {
                        connectionId: connection.connectionId,
                        messageType: message.type
                    });
                    this.sendError(connection, 'unknown_message_type', 'Unknown message type');
            }
        } catch (error) {
            this.logger.error('Failed to handle WebSocket message', {
                connectionId: connection.connectionId,
                error: error.message
            });

            this.performanceMonitor.trackWebSocketEvent({
                event: 'message_handle_failed',
                connectionId: connection.connectionId,
                error: error.message
            });

            this.sendError(connection, 'internal_error', 'Failed to process message');
        }
    }

    private parseMessage(data: WebSocket.RawData): any | null {
        try {
            if (data instanceof Buffer) {
                return JSON.parse(data.toString());
            } else if (typeof data === 'string') {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            this.logger.error('Failed to parse WebSocket message', {
                error: error.message,
                data: data.toString()
            });
            return null;
        }
    }

    private async handleRouteOptimizationRequest(
        connection: WebSocketConnection,
        message: any
    ): Promise<void> {
        try {
            if (!this.hasPermission(connection, 'route_optimization:create')) {
                this.sendError(connection, 'permission_denied', 'Insufficient permissions');
                return;
            }

            const request: RouteOptimizationRequest = {
                ...message.data,
                requestId: message.requestId || this.generateRequestId(),
                userId: connection.userId,
                vehicleId: connection.vehicleId,
                depotId: connection.depotId,
                status: 'pending',
                createdAt: new Date()
            };

            this.logger.info('Received route optimization request', {
                connectionId: connection.connectionId,
                requestId: request.requestId,
                vehicleId: request.vehicleId
            });

            // Send immediate acknowledgment
            this.sendAcknowledgment(connection, message.requestId, 'route_optimization_request');

            // Process the request
            const response = await this.routeOptimizationService.optimizeRoute(request);

            // Send the response back to the client
            this.sendMessage(connection, {
                type: 'route_optimization_response',
                requestId: request.requestId,
                data: response
            });

            // Broadcast to other interested parties
            this.broadcastToDepot(connection.depotId!, {
                type: 'route_optimization_update',
                requestId: request.requestId,
                data: {
                    status: 'completed',
                    response
                }
            }, connection.connectionId);
        } catch (error) {
            this.logger.error('Failed to handle route optimization request', {
                connectionId: connection.connectionId,
                error: error.message
            });

            this.sendError(connection, 'optimization_failed', error.message);

            this.broadcastToDepot(connection.depotId!, {
                type: 'route_optimization_update',
                requestId: message.requestId,
                data: {
                    status: 'failed',
                    error: error.message
                }
            }, connection.connectionId);
        }
    }

    private async handleRouteOptimizationCancel(
        connection: WebSocketConnection,
        message: any
    ): Promise<void> {
        try {
            if (!this.hasPermission(connection, 'route_optimization:cancel')) {
                this.sendError(connection, 'permission_denied', 'Insufficient permissions');
                return;
            }

            const { requestId } = message;
            if (!requestId) {
                this.sendError(connection, 'invalid_request', 'requestId is required');
                return;
            }

            this.logger.info('Received route optimization cancel request', {
                connectionId: connection.connectionId,
                requestId
            });

            await this.routeOptimizationService.cancelRouteOptimization(requestId);

            this.sendAcknowledgment(connection, requestId, 'route_optimization_cancel');

            this.broadcastToDepot(connection.depotId!, {
                type: 'route_optimization_update',
                requestId,
                data: {
                    status: 'cancelled'
                }
            }, connection.connectionId);
        } catch (error) {
            this.logger.error('Failed to handle route optimization cancel', {
                connectionId: connection.connectionId,
                error: error.message
            });

            this.sendError(connection, 'cancel_failed', error.message);
        }
    }

    private async handleVehicleLocationUpdate(
        connection: WebSocketConnection,
        message: any
    ): Promise<void> {
        try {
            if (!this.hasPermission(connection, 'vehicle:update_location')) {
                this.sendError(connection, 'permission_denied', 'Insufficient permissions');
                return;
            }

            if (!connection.vehicleId) {
                this.sendError(connection, 'invalid_connection', 'Vehicle ID not associated with connection');
                return;
            }

            const locationUpdate: VehicleLocationUpdate = {
                ...message.data,
                vehicleId: connection.vehicleId,
                timestamp: new Date(),
                connectionId: connection.connectionId
            };

            this.logger.debug('Received vehicle location update', {
                connectionId: connection.connectionId,
                vehicleId: connection.vehicleId,
                location: locationUpdate
            });

            await this.vehicleTrackingService.updateVehicleLocation(locationUpdate);

            this.sendAcknowledgment(connection, message.requestId, 'vehicle_location_update');

            // Broadcast to depot and dispatchers
            this.broadcastToDepot(connection.depotId!, {
                type: 'vehicle_location_update',
                vehicleId: connection.vehicleId,
                data: locationUpdate
            }, connection.connectionId);
        } catch (error) {
            this.logger.error('Failed to handle vehicle location update', {
                connectionId: connection.connectionId,
                error: error.message
            });

            this.sendError(connection, 'location_update_failed', error.message);
        }
    }

    private async handleRouteEvent(
        connection: WebSocketConnection,
        message: any
    ): Promise<void> {
        try {
            if (!this.hasPermission(connection, 'route:create_event')) {
                this.sendError(connection, 'permission_denied', 'Insufficient permissions');
                return;
            }

            if (!connection.vehicleId) {
                this.sendError(connection, 'invalid_connection', 'Vehicle ID not associated with connection');
                return;
            }

            const routeEvent: RouteEvent = {
                ...message.data,
                eventId: this.generateEventId(),
                vehicleId: connection.vehicleId,
                timestamp: new Date(),
                userId: connection.userId
            };

            this.logger.info('Received route event', {
                connectionId: connection.connectionId,
                eventId: routeEvent.eventId,
                eventType: routeEvent.eventType
            });

            await this.routeOptimizationService.handleRouteEvent(routeEvent);

            this.sendAcknowledgment(connection, message.requestId, 'route_event');

            // Broadcast to depot and dispatchers
            this.broadcastToDepot(connection.depotId!, {
                type: 'route_event',
                data: routeEvent
            }, connection.connectionId);

            // If this is a significant event, send notification
            if (this.isSignificantEvent(routeEvent)) {
                await this.notificationService.createNotification({
                    type: 'route_event',
                    title: `Route Event: ${routeEvent.eventType}`,
                    message: routeEvent.description || routeEvent.eventType,
                    data: routeEvent,
                    recipients: ['dispatcher', 'manager'],
                    vehicleId: connection.vehicleId,
                    depotId: connection.depotId
                });
            }
        } catch (error) {
            this.logger.error('Failed to handle route event', {
                connectionId: connection.connectionId,
                error: error.message
            });

            this.sendError(connection, 'event_handling_failed', error.message);
        }
    }

    private async handleRouteStatusSubscription(
        connection: WebSocketConnection,
        message: any
    ): Promise<void> {
        try {
            if (!this.hasPermission(connection, 'route:subscribe_status')) {
                this.sendError(connection, 'permission_denied', 'Insufficient permissions');
                return;
            }

            const { requestId, subscribe } = message;
            if (requestId === undefined || subscribe === undefined) {
                this.sendError(connection, 'invalid_request', 'requestId and subscribe are required');
                return;
            }

            this.logger.info('Route status subscription request', {
                connectionId: connection.connectionId,
                requestId,
                subscribe
            });

            if (subscribe) {
                await this.routeOptimizationService.subscribeToRouteStatus(
                    requestId,
                    connection.connectionId
                );
            } else {
                await this.routeOptimizationService.unsubscribeFromRouteStatus(
                    requestId,
                    connection.connectionId
                );
            }

            this.sendAcknowledgment(connection, message.requestId, 'route_status_subscription');
        } catch (error) {
            this.logger.error('Failed to handle route status subscription', {
                connectionId: connection.connectionId,
                error: error.message
            });

            this.sendError(connection, 'subscription_failed', error.message);
        }
    }

    private async handleVehicleStatusSubscription(
        connection: WebSocketConnection,
        message: any
    ): Promise<void> {
        try {
            if (!this.hasPermission(connection, 'vehicle:subscribe_status')) {
                this.sendError(connection, 'permission_denied', 'Insufficient permissions');
                return;
            }

            const { vehicleId, subscribe } = message;
            if (vehicleId === undefined || subscribe === undefined) {
                this.sendError(connection, 'invalid_request', 'vehicleId and subscribe are required');
                return;
            }

            this.logger.info('Vehicle status subscription request', {
                connectionId: connection.connectionId,
                vehicleId,
                subscribe
            });

            if (subscribe) {
                await this.vehicleTrackingService.subscribeToVehicleStatus(
                    vehicleId,
                    connection.connectionId
                );
            } else {
                await this.vehicleTrackingService.unsubscribeFromVehicleStatus(
                    vehicleId,
                    connection.connectionId
                );
            }

            this.sendAcknowledgment(connection, message.requestId, 'vehicle_status_subscription');
        } catch (error) {
            this.logger.error('Failed to handle vehicle status subscription', {
                connectionId: connection.connectionId,
                error: error.message
            });

            this.sendError(connection, 'subscription_failed', error.message);
        }
    }

    private async handleNotificationSubscription(
        connection: WebSocketConnection,
        message: any
    ): Promise<void> {
        try {
            if (!this.hasPermission(connection, 'notification:subscribe')) {
                this.sendError(connection, 'permission_denied', 'Insufficient permissions');
                return;
            }

            const { subscribe } = message;
            if (subscribe === undefined) {
                this.sendError(connection, 'invalid_request', 'subscribe is required');
                return;
            }

            this.logger.info('Notification subscription request', {
                connectionId: connection.connectionId,
                subscribe
            });

            if (subscribe) {
                await this.notificationService.subscribeToNotifications(
                    connection.userId,
                    connection.connectionId
                );
            } else {
                await this.notificationService.unsubscribeFromNotifications(
                    connection.userId,
                    connection.connectionId
                );
            }

            this.sendAcknowledgment(connection, message.requestId, 'notification_subscription');
        } catch (error) {
            this.logger.error('Failed to handle notification subscription', {
                connectionId: connection.connectionId,
                error: error.message
            });

            this.sendError(connection, 'subscription_failed', error.message);
        }
    }

    private handlePing(connection: WebSocketConnection): void {
        this.logger.debug('Received ping from client', {
            connectionId: connection.connectionId
        });

        this.sendMessage(connection, {
            type: 'pong',
            timestamp: new Date().toISOString()
        });
    }

    private handleClose(connection: WebSocketConnection, code: number, reason: Buffer): void {
        this.logger.info('WebSocket connection closed', {
            connectionId: connection.connectionId,
            code,
            reason: reason.toString()
        });

        // Clean up subscriptions
        this.routeOptimizationService.unsubscribeAllForConnection(connection.connectionId);
        this.vehicleTrackingService.unsubscribeAllForConnection(connection.connectionId);
        this.notificationService.unsubscribeFromNotifications(connection.userId, connection.connectionId);

        this.performanceMonitor.trackWebSocketEvent({
            event: 'connection_closed',
            connectionId: connection.connectionId,
            userId: connection.userId,
            code,
            reason: reason.toString()
        });
    }

    private handleError(connection: WebSocketConnection, error: Error): void {
        this.logger.error('WebSocket connection error', {
            connectionId: connection.connectionId,
            error: error.message
        });

        this.performanceMonitor.trackWebSocketEvent({
            event: 'connection_error',
            connectionId: connection.connectionId,
            error: error.message
        });
    }

    private hasPermission(connection: WebSocketConnection, permission: string): boolean {
        return connection.roles.some(role =>
            this.config.rolePermissions[role]?.includes(permission)
        );
    }

    private sendAcknowledgment(
        connection: WebSocketConnection,
        requestId: string,
        messageType: string
    ): void {
        this.sendMessage(connection, {
            type: 'acknowledgment',
            requestId,
            messageType,
            timestamp: new Date().toISOString()
        });
    }

    private sendError(
        connection: WebSocketConnection,
        errorCode: string,
        errorMessage: string
    ): void {
        this.sendMessage(connection, {
            type: 'error',
            errorCode,
            errorMessage,
            timestamp: new Date().toISOString()
        });
    }

    private sendMessage(connection: WebSocketConnection, message: any): void {
        const webSocketManager = require('./websocket-manager').WebSocketManager.getInstance();
        webSocketManager.sendMessage(connection, message);
    }

    private broadcastToDepot(depotId: string, message: any, excludeConnectionId?: string): void {
        const webSocketManager = require('./websocket-manager').WebSocketManager.getInstance();
        const connections = webSocketManager.getConnectionsByDepotId(depotId);

        connections.forEach(connection => {
            if (connection.connectionId !== excludeConnectionId) {
                webSocketManager.sendMessage(connection, message);
            }
        });
    }

    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateEventId(): string {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private isSignificantEvent(event: RouteEvent): boolean {
        const significantEvents = [
            'accident',
            'breakdown',
            'traffic_jam',
            'road_closure',
            'weather_alert',
            'delivery_issue',
            'customer_unavailable',
            'emergency'
        ];

        return significantEvents.includes(event.eventType);
    }
}
```

### Client-Side WebSocket Integration (70 lines)

```typescript
import { Logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { WebSocketConfig } from '../config/websocket-config';
import {
    RouteOptimizationRequest,
    RouteOptimizationResponse,
    VehicleLocationUpdate,
    RouteEvent,
    NotificationMessage
} from '../types/route-types';

type WebSocketMessage =
    | { type: 'welcome', data: any }
    | { type: 'route_optimization_response', requestId: string, data: RouteOptimizationResponse }
    | { type: 'route_optimization_update', requestId: string, data: any }
    | { type: 'vehicle_location_update', vehicleId: string, data: VehicleLocationUpdate }
    | { type: 'route_event', data: RouteEvent }
    | { type: 'notification', data: NotificationMessage }
    | { type: 'acknowledgment', requestId: string, messageType: string }
    | { type: 'error', errorCode: string, errorMessage: string }
    | { type: 'pong', timestamp: string };

type WebSocketEventCallback<T = any> = (data: T) => void;
type WebSocketErrorCallback = (error: Error) => void;
type WebSocketCloseCallback = (code: number, reason: string) => void;

interface WebSocketClientOptions {
    url?: string;
    token: string;
    vehicleId?: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    pingInterval?: number;
    autoReconnect?: boolean;
}

export class WebSocketClient {
    private socket: WebSocket | null = null;
    private logger: Logger;
    private performanceMonitor: PerformanceMonitor;
    private config: WebSocketConfig;
    private options: WebSocketClientOptions;
    private eventCallbacks: Map<string, WebSocketEventCallback[]>;
    private errorCallbacks: WebSocketErrorCallback[];
    private closeCallbacks: WebSocketCloseCallback[];
    private reconnectAttempts: number = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private pingTimer: NodeJS.Timeout | null = null;
    private connectionId: string | null = null;
    private isConnecting: boolean = false;
    private shouldReconnect: boolean = true;
    private static instance: WebSocketClient;

    private constructor(options: WebSocketClientOptions) {
        this.config = WebSocketConfig.getInstance();
        this.logger = new Logger('WebSocketClient');
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.options = {
            url: options.url || this.config.clientUrl,
            token: options.token,
            vehicleId: options.vehicleId,
            reconnectInterval: options.reconnectInterval || 5000,
            maxReconnectAttempts: options.maxReconnectAttempts || 10,
            pingInterval: options.pingInterval || 30000,
            autoReconnect: options.autoReconnect !== false
        };

        this.eventCallbacks = new Map();
        this.errorCallbacks = [];
        this.closeCallbacks = [];

        this.initialize();
    }

    public static getInstance(options: WebSocketClientOptions): WebSocketClient {
        if (!WebSocketClient.instance) {
            WebSocketClient.instance = new WebSocketClient(options);
        }
        return WebSocketClient.instance;
    }

    private initialize(): void {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Setup global error handler
        window.addEventListener('error', (event) => {
            this.logger.error('Global error occurred', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Setup offline/online detection
        window.addEventListener('offline', () => {
            this.logger.warn('Network connection lost');
            this.performanceMonitor.trackWebSocketEvent({
                event: 'network_offline'
            });
        });

        window.addEventListener('online', () => {
            this.logger.info('Network connection restored');
            this.performanceMonitor.trackWebSocketEvent({
                event: 'network_online'
            });

            if (this.shouldReconnect && !this.socket) {
                this.connect();
            }
        });
    }

    public connect(): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.logger.info('WebSocket already connected');
            return;
        }

        if (this.isConnecting) {
            this.logger.info('WebSocket connection already in progress');
            return;
        }

        this.isConnecting = true;
        this.shouldReconnect = true;

        try {
            const url = new URL(this.options.url);
            url.searchParams.append('token', this.options.token);
            if (this.options.vehicleId) {
                url.searchParams.append('vehicleId', this.options.vehicleId);
            }

            this.logger.info('Connecting to WebSocket server', { url: url.toString() });

            this.socket = new WebSocket(url.toString());

            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onerror = this.handleError.bind(this);
            this.socket.onclose = this.handleClose.bind(this);

            this.performanceMonitor.trackWebSocketEvent({
                event: 'connecting',
                url: url.toString()
            });
        } catch (error) {
            this.isConnecting = false;
            this.logger.error('Failed to create WebSocket connection', { error });
            this.triggerErrorCallbacks(error);

            if (this.options.autoReconnect) {
                this.scheduleReconnect();
            }
        }
    }

    public disconnect(): void {
        this.shouldReconnect = false;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }

        if (this.socket) {
            this.logger.info('Disconnecting WebSocket');
            this.socket.close(1000, 'Client initiated disconnect');
        }
    }

    private handleOpen(event: Event): void {
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        this.logger.info('WebSocket connection opened', {
            readyState: this.socket?.readyState
        });

        this.performanceMonitor.trackWebSocketEvent({
            event: 'connected',
            readyState: this.socket?.readyState
        });

        // Start ping/pong
        this.startPing();

        // Reset connection state
        this.connectionId = null;

        // Trigger open callbacks
        this.triggerEventCallbacks('open', event);
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);

            this.performanceMonitor.trackWebSocketEvent({
                event: 'message_received',
                messageType: message.type,
                messageSize: event.data.length
            });

            this.logger.debug('Received WebSocket message', {
                type: message.type,
                size: event.data.length
            });

            // Handle welcome message
            if (message.type === 'welcome') {
                this.connectionId = message.connectionId;
                this.logger.info('WebSocket welcome message received', {
                    connectionId: this.connectionId
                });
            }

            // Handle pong message
            if (message.type === 'pong') {
                this.logger.debug('Received pong from server');
                return;
            }

            // Trigger appropriate callbacks
            this.triggerEventCallbacks(message.type, message);
        } catch (error) {
            this.logger.error('Failed to parse WebSocket message', {
                error: error.message,
                data: event.data
            });

            this.triggerErrorCallbacks(new Error('Failed to parse WebSocket message'));
        }
    }

    private handleError(event: Event): void {
        const error = new Error('WebSocket error occurred');
        this.logger.error('WebSocket error', {
            error: error.message,
            event
        });

        this.performanceMonitor.trackWebSocketEvent({
            event: 'error',
            error: error.message
        });

        this.triggerErrorCallbacks(error);

        // The close event will be triggered after this
    }

    private handleClose(event: CloseEvent): void {
        this.isConnecting = false;

        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }

        this.logger.info('WebSocket connection closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
        });

        this.performanceMonitor.trackWebSocketEvent({
            event: 'disconnected',
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
        });

        this.triggerCloseCallbacks(event.code, event.reason);

        if (this.shouldReconnect && this.options.autoReconnect) {
            this.scheduleReconnect();
        }
    }

    private startPing(): void {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
        }

        this.pingTimer = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.logger.debug('Sending ping to server');
                this.socket.send(JSON.stringify({ type: 'ping' }));

                this.performanceMonitor.trackWebSocketEvent({
                    event: 'ping_sent'
                });
            }
        }, this.options.pingInterval);
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            this.logger.warn('Max reconnect attempts reached');
            this.triggerErrorCallbacks(new Error('Max reconnect attempts reached'));
            return;
        }

        const delay = Math.min(
            this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts),
            30000 // Max 30 seconds
        );

        this.reconnectAttempts++;

        this.logger.info('Scheduling WebSocket reconnect', {
            attempt: this.reconnectAttempts,
            delay
        });

        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }

    public on(eventType: 'open', callback: (event: Event) => void): void;
    public on(eventType: 'route_optimization_response', callback: (response: RouteOptimizationResponse) => void): void;
    public on(eventType: 'route_optimization_update', callback: (update: any) => void): void;
    public on(eventType: 'vehicle_location_update', callback: (update: VehicleLocationUpdate) => void): void;
    public on(eventType: 'route_event', callback: (event: RouteEvent) => void): void;
    public on(eventType: 'notification', callback: (notification: NotificationMessage) => void): void;
    public on(eventType: 'acknowledgment', callback: (ack: { requestId: string, messageType: string }) => void): void;
    public on(eventType: 'error', callback: (error: Error) => void): void;
    public on(eventType: 'close', callback: (code: number, reason: string) => void): void;
    public on(eventType: string, callback: WebSocketEventCallback): void {
        if (!this.eventCallbacks.has(eventType)) {
            this.eventCallbacks.set(eventType, []);
        }

        this.eventCallbacks.get(eventType)?.push(callback);
    }

    public off(eventType: string, callback: WebSocketEventCallback): void {
        const callbacks = this.eventCallbacks.get(eventType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    public onError(callback: WebSocketErrorCallback): void {
        this.errorCallbacks.push(callback);
    }

    public offError(callback: WebSocketErrorCallback): void {
        const index = this.errorCallbacks.indexOf(callback);
        if (index !== -1) {
            this.errorCallbacks.splice(index, 1);
        }
    }

    public onClose(callback: WebSocketCloseCallback): void {
        this.closeCallbacks.push(callback);
    }

    public offClose(callback: WebSocketCloseCallback): void {
        const index = this.closeCallbacks.indexOf(callback);
        if (index !== -1) {
            this.closeCallbacks.splice(index, 1);
        }
    }

    private triggerEventCallbacks(eventType: string, data: any): void {
        const callbacks = this.eventCallbacks.get(eventType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.logger.error('Error in event callback', {
                        eventType,
                        error: error.message
                    });
                }
            });
        }
    }

    private triggerErrorCallbacks(error: Error): void {
        this.errorCallbacks.forEach(callback => {
            try {
                callback(error);
            } catch (cbError) {
                this.logger.error('Error in error callback', {
                    error: cbError.message
                });
            }
        });
    }

    private triggerCloseCallbacks(code: number, reason: string): void {
        this.closeCallbacks.forEach(callback => {
            try {
                callback(code, reason);
            } catch (cbError) {
                this.logger.error('Error in close callback', {
                    error: cbError.message
                });
            }
        });
    }

    public send(message: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket is not connected'));
                return;
            }

            try {
                const messageString = JSON.stringify(message);
                this.socket.send(messageString);

                this.logger.debug('Sent WebSocket message', {
                    type: message.type,
                    size: messageString.length
                });

                this.performanceMonitor.trackWebSocketEvent({
                    event: 'message_sent',
                    messageType: message.type,
                    messageSize: messageString.length
                });

                resolve();
            } catch (error) {
                this.logger.error('Failed to send WebSocket message', {
                    error: error.message,
                    messageType: message.type
                });

                this.performanceMonitor.trackWebSocketEvent({
                    event: 'message_send_failed',
                    error: error.message,
                    messageType: message.type
                });

                reject(error);
            }
        });
    }

    public requestRouteOptimization(request: RouteOptimizationRequest): Promise<RouteOptimizationResponse> {
        return new Promise((resolve, reject) => {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const timeout = setTimeout(() => {
                this.off('route_optimization_response', responseHandler);
                this.off('error', errorHandler);
                reject(new Error('Route optimization request timed out'));
            }, 30000); // 30 second timeout

            const responseHandler = (response: RouteOptimizationResponse) => {
                if (response.requestId === requestId) {
                    clearTimeout(timeout);
                    this.off('route_optimization_response', responseHandler);
                    this.off('error', errorHandler);
                    resolve(response);
                }
            };

            const errorHandler = (error: Error) => {
                clearTimeout(timeout);
                this.off('route_optimization_response', responseHandler);
                this.off('error', errorHandler);
                reject(error);
            };

            this.on('route_optimization_response', responseHandler);
            this.on('error', errorHandler);

            this.send({
                type: 'route_optimization_request',
                requestId,
                data: request
            }).catch(reject);
        });
    }

    public cancelRouteOptimization(requestId: string): Promise<void> {
        return this.send({
            type: 'route_optimization_cancel',
            requestId
        });
    }

    public updateVehicleLocation(location: VehicleLocationUpdate): Promise<void> {
        return this.send({
            type: 'vehicle_location_update',
            data: location
        });
    }

    public reportRouteEvent(event: RouteEvent): Promise<void> {
        return this.send({
            type: 'route_event',
            data: event
        });
    }

    public subscribeToRouteStatus(requestId: string): Promise<void> {
        return this.send({
            type: 'route_status_subscription',
            requestId,
            subscribe: true
        });
    }

    public unsubscribeFromRouteStatus(requestId: string): Promise<void> {
        return this.send({
            type: 'route_status_subscription',
            requestId,
            subscribe: false
        });
    }

    public subscribeToVehicleStatus(vehicleId: string): Promise<void> {
        return this.send({
            type: 'vehicle_status_subscription',
            vehicleId,
            subscribe: true
        });
    }

    public unsubscribeFromVehicleStatus(vehicleId: string): Promise<void> {
        return this.send({
            type: 'vehicle_status_subscription',
            vehicleId,
            subscribe: false
        });
    }

    public subscribeToNotifications(): Promise<void> {
        return this.send({
            type: 'notification_subscription',
            subscribe: true
        });
    }

    public unsubscribeFromNotifications(): Promise<void> {
        return this.send({
            type: 'notification_subscription',
            subscribe: false
        });
    }

    public getConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
        if (!this.socket) {
            return 'closed';
        }
        return ['connecting', 'open', 'closing', 'closed'][this.socket.readyState];
    }

    public getConnectionId(): string | null {
        return this.connectionId;
    }

    public isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}
```

### Room/Channel Management (60 lines)

```typescript
import { WebSocketConnection } from './websocket-manager';
import { Logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { WebSocketConfig } from '../config/websocket-config';

interface Room {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    members: Set<string>; // connectionIds
    metadata?: any;
}

interface Channel {
    id: string;
    name: string;
    roomId: string;
    description?: string;
    createdAt: Date;
    subscribers: Set<string>; // connectionIds
    metadata?: any;
}

export class RoomChannelManager {
    private rooms: Map<string, Room>;
    private channels: Map<string, Channel>;
    private logger: Logger;
    private performanceMonitor: PerformanceMonitor;
    private config: WebSocketConfig;
    private static instance: RoomChannelManager;

    private constructor() {
        this.config = WebSocketConfig.getInstance();
        this.logger = new Logger('RoomChannelManager');
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.rooms = new Map();
        this.channels = new Map();

        this.initializeDefaultRooms();
    }

    public static getInstance(): RoomChannelManager {
        if (!RoomChannelManager.instance) {
            RoomChannelManager.instance = new RoomChannelManager();
        }
        return RoomChannelManager.instance;
    }

    private initializeDefaultRooms(): void {
        // Create default rooms
        this.createRoom({
            id: 'global',
            name: 'Global Room',
            description: 'Default room for all users',
            metadata: { isDefault: true }
        });

        this.createRoom({
            id: 'dispatchers',
            name: 'Dispatchers Room',
            description: 'Room for dispatchers and managers',
            metadata: { roleRequired: 'dispatcher' }
        });

        this.createRoom({
            id: 'drivers',
            name: 'Drivers Room',
            description: 'Room for drivers',
            metadata: { roleRequired: 'driver' }
        });

        // Create default channels
        this.createChannel({
            id: 'global-notifications',
            name: 'Global Notifications',
            roomId: 'global',
            description: 'Channel for system-wide notifications'
        });

        this.createChannel({
            id: 'route-updates',
            name: 'Route Updates',
            roomId: 'global',
            description: 'Channel for route optimization updates'
        });

        this.createChannel({
            id: 'vehicle-updates',
            name: 'Vehicle Updates',
            roomId: 'global',
            description: 'Channel for vehicle location and status updates'
        });
    }

    public createRoom(room: Omit<Room, 'members' | 'createdAt'>): Room {
        if (this.rooms.has(room.id)) {
            throw new Error(`Room with id ${room.id} already exists`);
        }

        const newRoom: Room = {
            ...room,
            members: new Set(),
            createdAt: new Date()
        };

        this.rooms.set(room.id, newRoom);

        this.logger.info('Created new room', {
            roomId: room.id,
            roomName: room.name
        });

        this.performanceMonitor.trackRoomEvent({
            event: 'room_created',
            roomId: room.id,
            roomName: room.name
        });

        return newRoom;
    }

    public updateRoom(roomId: string, updates: Partial<Omit<Room, 'id' | 'members' | 'createdAt'>>): Room {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error(`Room with id ${roomId} not found`);
        }

        const updatedRoom = {
            ...room,
            ...updates,
            id: room.id,
            members: room.members,
            createdAt: room.createdAt
        };

        this.rooms.set(roomId, updatedRoom);

        this.logger.info('Updated room', {
            roomId: room.id,
            updates
        });

        this.performanceMonitor.trackRoomEvent({
            event: 'room_updated',
            roomId: room.id,
            updates
        });

        return updatedRoom;
    }

    public deleteRoom(roomId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        // Remove all members from the room
        room.members.forEach(connectionId => {
            this.removeConnectionFromRoom(roomId, connectionId);
        });

        // Delete all channels in this room
        this.channels.forEach((channel, channelId) => {
            if (channel.roomId === roomId) {
                this.deleteChannel(channelId);
            }
        });

        this.rooms.delete(roomId);

        this.logger.info('Deleted room', {
            roomId: room.id,
            roomName: room.name
        });

        this.performanceMonitor.trackRoomEvent({
            event: 'room_deleted',
            roomId: room.id,
            roomName: room.name
        });

        return true;
    }

    public getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    public getRooms(): Room[] {
        return Array.from(this.rooms.values());
    }

    public getRoomsForConnection(connectionId: string): Room[] {
        return this.getRooms().filter(room =>
            room.members.has(connectionId)
        );
    }

    public addConnectionToRoom(roomId: string, connectionId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        if (room.members.has(connectionId)) {
            return false;
        }

        // Check if connection has required role (if specified)
        const connection = this.getConnection(connectionId);
        if (connection && room.metadata?.roleRequired) {
            if (!connection.roles.includes(room.metadata.roleRequired)) {
                this.logger.warn('Connection does not have required role for room', {
                    connectionId,
                    roomId,
                    requiredRole: room.metadata.roleRequired,
                    connectionRoles: connection.roles
                });
                return false;
            }
        }

        room.members.add(connectionId);

        this.logger.info('Added connection to room', {
            connectionId,
            roomId: room.id,
            roomName: room.name
        });

        this.performanceMonitor.trackRoomEvent({
            event: 'connection_added_to_room',
            connectionId,
            roomId: room.id,
            roomName: room.name
        });

        return true;
    }

    public removeConnectionFromRoom(roomId: string, connectionId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        if (!room.members.has(connectionId)) {
            return false;
        }

        room.members.delete(connectionId);

        this.logger.info('Removed connection from room', {
            connectionId,
            roomId: room.id,
            roomName: room.name
        });

        this.performanceMonitor.trackRoomEvent({
            event: 'connection_removed_from_room',
            connectionId,
            roomId: room.id,
            roomName: room.name
        });

        return true;
    }

    public createChannel(channel: Omit<Channel, 'subscribers' | 'createdAt'>): Channel {
        if (this.channels.has(channel.id)) {
            throw new Error(`Channel with id ${channel.id} already exists`);
        }

        if (!this.rooms.has(channel.roomId)) {
            throw new Error(`Room with id ${channel.roomId} not found`);
        }

        const newChannel: Channel = {
            ...channel,
            subscribers: new Set(),
            createdAt: new Date()
        };

        this.channels.set(channel.id, newChannel);

        this.logger.info('Created new channel', {
            channelId: channel.id,
            channelName: channel.name,
            roomId: channel.roomId
        });

        this.performanceMonitor.trackChannelEvent({
            event: 'channel_created',
            channelId: channel.id,
            channelName: channel.name,
            roomId: channel.roomId
        });

        return newChannel;
    }

    public updateChannel(channelId: string, updates: Partial<Omit<Channel, 'id' | 'roomId' | 'subscribers' | 'createdAt'>>): Channel {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Channel with id ${channelId} not found`);
        }

        const updatedChannel = {
            ...channel,
            ...updates,
            id: channel.id,
            roomId: channel.roomId,
            subscribers: channel.subscribers,
            createdAt: channel.createdAt
        };

        this.channels.set(channelId, updatedChannel);

        this.logger.info('Updated channel', {
            channelId: channel.id,
            updates
        });

        this.performanceMonitor.trackChannelEvent({
            event: 'channel_updated',
            channelId: channel.id,
            updates
        });

        return updatedChannel;
    }

    public deleteChannel(channelId: string): boolean {
        const channel = this.channels.get(channelId);
        if (!channel) {
            return false;
        }

        // Remove all subscribers from the channel
        channel.subscribers.forEach(connectionId => {
            this.unsubscribeFromChannel(channelId, connectionId);
        });

        this.channels.delete(channelId);

        this.logger.info('Deleted channel', {
            channelId: channel.id,
            channelName: channel.name
        });

        this.performanceMonitor.trackChannelEvent({
            event: 'channel_deleted',
            channelId: channel.id,
            channelName: channel.name
        });

        return true;
    }

    public getChannel(channelId: string): Channel | undefined {
        return this.channels.get(channelId);
    }

    public getChannels(): Channel[] {
        return Array.from(this.channels.values());
    }

    public getChannelsForRoom(roomId: string): Channel[] {
        return this.getChannels().filter(channel =>
            channel.roomId === roomId
        );
    }

    public getChannelsForConnection(connectionId: string): Channel[] {
        return this.getChannels().filter(channel =>
            channel.subscribers.has(connectionId)
        );
    }

    public subscribeToChannel(channelId: string, connectionId: string): boolean {
        const channel = this.channels.get(channelId);
        if (!channel) {
            return false;
        }

        if (channel.subscribers.has(connectionId)) {
            return false;
        }

        // Check if connection is in the channel's room
        const room = this.rooms.get(channel.roomId);
        if (!room || !room.members.has(connectionId)) {
            this.logger.warn('Connection not in channel room', {
                connectionId,
                channelId,
                roomId: channel.roomId
            });
            return false;
        }

        channel.subscribers.add(connectionId);

        this.logger.info('Subscribed connection to channel', {
            connectionId,
            channelId: channel.id,
            channelName: channel.name
        });

        this.performanceMonitor.trackChannelEvent({
            event: 'connection_subscribed_to_channel',
            connectionId,
            channelId: channel.id,
            channelName: channel.name
        });

        return true;
    }

    public unsubscribeFromChannel(channelId: string, connectionId: string): boolean {
        const channel = this.channels.get(channelId);
        if (!channel) {
            return false;
        }

        if (!channel.subscribers.has(connectionId)) {
            return false;
        }

        channel.subscribers.delete(connectionId);

        this.logger.info('Unsubscribed connection from channel', {
            connectionId,
            channelId: channel.id,
            channelName: channel.name
        });

        this.performanceMonitor.trackChannelEvent({
            event: 'connection_unsubscribed_from_channel',
            connectionId,
            channelId: channel.id,
            channelName: channel.name
        });

        return true;
    }

    public broadcastToRoom(roomId: string, message: any, excludeConnectionId?: string): void {
        const room = this.rooms.get(roomId);
        if (!room) {
            this.logger.warn('Attempted to broadcast to non-existent room', {
                roomId
            });
            return;
        }

        const webSocketManager = require('./websocket-manager').WebSocketManager.getInstance();

        room.members.forEach(connectionId => {
            if (connectionId !== excludeConnectionId) {
                const connection = webSocketManager.getConnection(connectionId);
                if (connection) {
                    webSocketManager.sendMessage(connection, message);
                }
            }
        });

        this.logger.debug('Broadcast message to room', {
            roomId: room.id,
            roomName: room.name,
            messageType: message.type,
            memberCount: room.members.size,
            excludeConnectionId
        });

        this.performanceMonitor.trackRoomEvent({
            event: 'message_broadcast_to_room',
            roomId: room.id,
            roomName: room.name,
            messageType: message.type,
            memberCount: room.members.size
        });
    }

    public broadcastToChannel(channelId: string, message: any, excludeConnectionId?: string): void {
        const channel = this.channels.get(channelId);
        if (!channel) {
            this.logger.warn('Attempted to broadcast to non-existent channel', {
                channelId
            });
            return;
        }

        const webSocketManager = require('./websocket-manager').WebSocketManager.getInstance();

        channel.subscribers.forEach(connectionId => {
            if (connectionId !== excludeConnectionId) {
                const connection = webSocketManager.getConnection(connectionId);
                if (connection) {
                    webSocketManager.sendMessage(connection, message);
                }
            }
        });

        this.logger.debug('Broadcast message to channel', {
            channelId: channel.id,
            channelName: channel.name,
            messageType: message.type,
            subscriberCount: channel.subscribers.size,
            excludeConnectionId
        });

        this.performanceMonitor.trackChannelEvent({
            event: 'message_broadcast_to_channel',
            channelId: channel.id,
            channelName: channel.name,
            messageType: message.type,
            subscriberCount: channel.subscribers.size
        });
    }

    public getRoomMembers(roomId: string): string[] {
        const room = this.rooms.get(roomId);
        if (!room) {
            return [];
        }
        return Array.from(room.members);
    }

    public getChannelSubscribers(channelId: string): string[] {
        const channel = this.channels.get(channelId);
        if (!channel) {
            return [];
        }
        return Array.from(channel.subscribers);
    }

    private getConnection(connectionId: string): WebSocketConnection | undefined {
        const webSocketManager = require('./websocket-manager').WebSocketManager.getInstance();
        return webSocketManager.getConnection(connectionId);
    }

    public autoJoinRooms(connection: WebSocketConnection): void {
        // Join global room
        this.addConnectionToRoom('global', connection.connectionId);

        // Join role-specific rooms
        if (connection.roles.includes('dispatcher')) {
            this.addConnectionToRoom('dispatchers', connection.connectionId);
        }

        if (connection.roles.includes('driver')) {
            this.addConnectionToRoom('drivers', connection.connectionId);
        }

        // Join depot-specific room if available
        if (connection.depotId) {
            const depotRoomId = `depot_${connection.depotId}`;
            if (!this.rooms.has(depotRoomId)) {
                this.createRoom({
                    id: depotRoomId,
                    name: `Depot ${connection.depotId}`,
                    description: `Room for depot ${connection.depotId}`,
                    metadata: { depotId: connection.depotId }
                });
            }
            this.addConnectionToRoom(depotRoomId, connection.connectionId);
        }

        // Join vehicle-specific room if available
        if (connection.vehicleId) {
            const vehicleRoomId = `vehicle_${connection.vehicleId}`;
            if (!this.rooms.has(vehicleRoomId)) {
                this.createRoom({
                    id: vehicleRoomId,
                    name: `Vehicle ${connection.vehicleId}`,
                    description: `Room for vehicle ${connection.vehicleId}`,
                    metadata: { vehicleId: connection.vehicleId }
                });
            }
            this.addConnectionToRoom(vehicleRoomId, connection.connectionId);
        }
    }

    public autoSubscribeChannels(connection: WebSocketConnection): void {
        // Subscribe to global channels
        this.subscribeToChannel('global-notifications', connection.connectionId);
        this.subscribeToChannel('route-updates', connection.connectionId);
        this.subscribeToChannel('vehicle-updates', connection.connectionId);

        // Subscribe to role-specific channels
        if (connection.roles.includes('dispatcher')) {
            this.subscribeToChannel('dispatcher-updates', connection.connectionId);
        }

        if (connection.roles.includes('driver')) {
            this.subscribeToChannel('driver-updates', connection.connectionId);
        }
    }
}
```

### Reconnection Logic (40 lines)

```typescript
import { WebSocketClient } from './websocket-client';
import { Logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { WebSocketConfig } from '../config/websocket-config';

interface ReconnectionOptions {
    maxAttempts?: number;
    baseInterval?: number;
    maxInterval?: number;
    jitter?: number;
    backoffFactor?: number;
    timeout?: number;
    onReconnect?: (attempt: number) => void;
    onMaxAttempts?: () => void;
}

export class WebSocketReconnector {
    private client: WebSocketClient;
    private logger: Logger;
    private performanceMonitor: PerformanceMonitor;
    private config: WebSocketConfig;
    private options: ReconnectionOptions;
    private reconnectAttempts: number = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private isReconnecting: boolean = false;
    private shouldReconnect: boolean = true;
    private static instance: WebSocketReconnector;

    private constructor(client: WebSocketClient, options: ReconnectionOptions = {}) {
        this.client = client;
        this.config = WebSocketConfig.getInstance();
        this.logger = new Logger('WebSocketReconnector');
        this.performanceMonitor = PerformanceMonitor.getInstance();

        this.options = {
            maxAttempts: options.maxAttempts || 10,
            baseInterval: options.baseInterval || 1000,
            maxInterval: options.maxInterval || 30000,
            jitter: options.jitter || 0.1,
            backoffFactor: options.backoffFactor || 2,
            timeout: options.timeout || 5000,
            onReconnect: options.onReconnect,
            onMaxAttempts: options.onMaxAttempts
        };

        this.setupEventListeners();
    }

    public static getInstance(client: WebSocketClient, options?: ReconnectionOptions): WebSocketReconnector {
        if (!WebSocketReconnector.instance) {
            WebSocketReconnector.instance = new WebSocketReconnector(client, options);
        }
        return WebSocketReconnector.instance;
    }

    private setupEventListeners(): void {
        this.client.onClose((code, reason) => {
            this.handleDisconnect(code, reason);
        });

        this.client.onError((error) => {
            this.logger.error('WebSocket error occurred', { error });
        });
    }

    private handleDisconnect(code: number, reason: string): void {
        if (!this.shouldReconnect) {
            this.logger.info('Reconnection disabled, not attempting to reconnect');
            return;
        }

        // Don't reconnect for certain close codes
        if (code === 1000 || // Normal closure
            code === 1001 || // Going away
            code === 1008 || // Policy violation
            code === 1011) { // Internal error
            this.logger.info('Not reconnecting due to close code', { code, reason });
            return;
        }

        if (!this.isReconnecting) {
            this.isReconnecting = true;
            this.reconnectAttempts = 0;
            this.attemptReconnect();
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.options.maxAttempts) {
            this.logger.warn('Max reconnection attempts reached');
            this.isReconnecting = false;

            if (this.options.onMaxAttempts) {
                this.options.onMaxAttempts();
            }

            this.performanceMonitor.trackWebSocketEvent({
                event: 'max_reconnect_attempts_reached',
                maxAttempts: this.options.maxAttempts
            });

            return;
        }

        this.reconnectAttempts++;

        const delay = this.calculateReconnectDelay();
        this.logger.info('Attempting to reconnect', {
            attempt: this.reconnectAttempts,
            delay,
            maxAttempts: this.options.maxAttempts
        });

        if (this.options.onReconnect) {
            this.options.onReconnect(this.reconnectAttempts);
        }

        this.reconnectTimer = setTimeout(() => {
            this.logger.info('Reconnecting...', { attempt: this.reconnectAttempts });

            this.client.connect();

            // Set timeout to check if connection was successful
            setTimeout(() => {
                if (this.client.getConnectionStatus() !== 'open') {
                    this.logger.warn('Reconnection attempt failed', {
                        attempt: this.reconnectAttempts
                    });
                    this.attemptReconnect();
                } else {
                    this.isReconnecting = false;
                    this.logger.info('Reconnection successful', {
                        attempt: this.reconnectAttempts
                    });

                    this.performanceMonitor.trackWebSocketEvent({
                        event: 'reconnect_successful',
                        attempt: this.reconnectAttempts,
                        delay
                    });
                }
            }, this.options.timeout);
        }, delay);
    }

    private calculateReconnectDelay(): number {
        // Exponential backoff with jitter
        const exponentialDelay = this.options.baseInterval * Math.pow(this.options.backoffFactor, this.reconnectAttempts - 1);
        const jitter = exponentialDelay * this.options.jitter * (Math.random() * 2 - 1);
        const delay = Math.min(exponentialDelay + jitter, this.options.maxInterval);

        return Math.max(delay, 0);
    }

    public enable(): void {
        this.shouldReconnect = true;
        this.logger.info('WebSocket reconnection enabled');
    }

    public disable(): void {
        this.shouldReconnect = false;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.isReconnecting = false;
        this.logger.info('WebSocket reconnection disabled');
    }

    public getReconnectStatus(): {
        isReconnecting: boolean;
        attempts: number;
        maxAttempts: number;
        shouldReconnect: boolean;
    } {
        return {
            isReconnecting: this.isReconnecting,
            attempts: this.reconnectAttempts,
            maxAttempts: this.options.maxAttempts,
            shouldReconnect: this.shouldReconnect
        };
    }

    public reset(): void {
        this.disable();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.reconnectAttempts = 0;
        this.isReconnecting = false;

        this.logger.info('WebSocket reconnector reset');
    }

    public async waitForConnection(timeout: number = 30000): Promise<boolean> {
        return new Promise((resolve) => {
            if (this.client.isConnected()) {
                resolve(true);
                return;
            }

            const checkInterval = 100;
            const maxChecks = timeout / checkInterval;
            let checks = 0;

            const interval = setInterval(() => {
                checks++;

                if (this.client.isConnected()) {
                    clearInterval(interval);
                    resolve(true);
                } else if (checks >= maxChecks) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, checkInterval);
        });
    }

    public async withRetry<T>(operation: () => Promise<T>, options: {
        maxRetries?: number;
        retryDelay?: number;
    } = {}): Promise<T> {
        const maxRetries = options.maxRetries || 3;
        const retryDelay = options.retryDelay || 1000;
        let lastError: Error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (!this.client.isConnected()) {
                    const connected = await this.waitForConnection();
                    if (!connected) {
                        throw new Error('WebSocket not connected');
                    }
                }

                return await operation();
            } catch (error) {
                lastError = error;
                this.logger.warn('Operation failed, retrying', {
                    attempt,
                    maxRetries,
                    error: error.message
                });

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        throw lastError;
    }
}
```

---

## AI/ML Capabilities (300 lines)

### Predictive Model Training (90 lines)

```python
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense, Dropout, BatchNormalization, Concatenate
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.regularizers import l2
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os
import json
from datetime import datetime
import logging
from typing import Tuple, Dict, Any, List
import boto3
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('RouteOptimizationModelTrainer')

class RouteOptimizationModelTrainer:
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the model trainer with configuration.

        Args:
            config: Configuration dictionary containing model parameters
        """
        self.config = config
        self.model = None
        self.preprocessor = None
        self.scaler = None
        self.feature_columns = None
        self.target_columns = None
        self.model_version = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Initialize S3 client if configured
        self.s3_client = None
        if self.config.get('s3', {}).get('enabled', False):
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=self.config['s3']['access_key'],
                aws_secret_access_key=self.config['s3']['secret_key'],
                region_name=self.config['s3']['region']
            )

        logger.info("RouteOptimizationModelTrainer initialized")

    def load_data(self, file_path: str) -> pd.DataFrame:
        """
        Load training data from file.

        Args:
            file_path: Path to the data file

        Returns:
            DataFrame containing the training data
        """
        logger.info(f"Loading data from {file_path}")

        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith('.parquet'):
                df = pd.read_parquet(file_path)
            elif file_path.endswith('.json'):
                df = pd.read_json(file_path)
            else:
                raise ValueError("Unsupported file format. Use CSV, Parquet, or JSON")

            logger.info(f"Loaded {len(df)} records with {len(df.columns)} columns")
            return df
        except Exception as e:
            logger.error(f"Failed to load data: {str(e)}")
            raise

    def preprocess_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Preprocess the data for training.

        Args:
            df: Raw DataFrame

        Returns:
            Tuple of (X, y, feature_info) where:
            - X: Features array
            - y: Target array
            - feature_info: Dictionary with feature information
        """
        logger.info("Preprocessing data")

        try:
            # Identify feature and target columns
            self.feature_columns = [col for col in df.columns if col not in self.config['target_columns']]
            self.target_columns = self.config['target_columns']

            logger.info(f"Feature columns: {self.feature_columns}")
            logger.info(f"Target columns: {self.target_columns}")

            # Separate features and targets
            X = df[self.feature_columns]
            y = df[self.target_columns]

            # Identify categorical and numerical columns
            categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
            numerical_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()

            logger.info(f"Categorical columns: {categorical_cols}")
            logger.info(f"Numerical columns: {numerical_cols}")

            # Create preprocessing pipeline
            self.preprocessor = ColumnTransformer(
                transformers=[
                    ('num', StandardScaler(), numerical_cols),
                    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
                ])

            # Fit and transform the features
            X_processed = self.preprocessor.fit_transform(X)

            # Convert targets to numpy array
            y_processed = y.values

            # Get feature names after one-hot encoding
            feature_names = numerical_cols.copy()
            if len(categorical_cols) > 0:
                ohe_feature_names = self.preprocessor.named_transformers_['cat'].get_feature_names_out(categorical_cols)
                feature_names.extend(ohe_feature_names)

            # Get target names
            target_names = y.columns.tolist()

            # Create feature info dictionary
            feature_info = {
                'feature_columns': self.feature_columns,
                'target_columns': self.target_columns,
                'categorical_columns': categorical_cols,
                'numerical_columns': numerical_cols,
                'feature_names': feature_names,
                'target_names': target_names,
                'num_features': X_processed.shape[1],
                'num_targets': y_processed.shape[1]
            }

            logger.info(f"Preprocessing completed. Features shape: {X_processed.shape}, Targets shape: {y_processed.shape}")

            return X_processed, y_processed, feature_info
        except Exception as e:
            logger.error(f"Failed to preprocess data: {str(e)}")
            raise

    def build_model(self, input_shape: int, output_shape: int, feature_info: Dict[str, Any]) -> Model:
        """
        Build the neural network model.

        Args:
            input_shape: Number of input features
            output_shape: Number of output targets
            feature_info: Dictionary with feature information

        Returns:
            Compiled Keras model
        """
        logger.info(f"Building model with input shape: {input_shape}, output shape: {output_shape}")

        try:
            # Input layer
            inputs = Input(shape=(input_shape,))

            # Hidden layers
            x = Dense(
                self.config['model']['hidden_units'][0],
                activation='relu',
                kernel_regularizer=l2(self.config['model']['l2_reg'])
            )(inputs)
            x = BatchNormalization()(x)
            x = Dropout(self.config['model']['dropout_rate'])(x)

            for units in self.config['model']['hidden_units'][1:]:
                x = Dense(
                    units,
                    activation='relu',
                    kernel_regularizer=l2(self.config['model']['l2_reg'])
                )(x)
                x = BatchNormalization()(x)
                x = Dropout(self.config['model']['dropout_rate'])(x)

            # Output layer
            outputs = Dense(
                output_shape,
                activation=self.config['model']['output_activation']
            )(x)

            # Create model
            model = Model(inputs=inputs, outputs=outputs)

            # Compile model
            optimizer = Adam(learning_rate=self.config['model']['learning_rate'])
            model.compile(
                optimizer=optimizer,
                loss=self.config['model']['loss_function'],
                metrics=self.config['model']['metrics']
            )

            logger.info("Model built and compiled successfully")
            logger.info(model.summary())

            return model
        except Exception as e:
            logger.error(f"Failed to build model: {str(e)}")
            raise

    def train_model(
        self,
        X: np.ndarray,
        y: np.ndarray,
        feature_info: Dict[str, Any]
    ) -> Tuple[Model, Dict[str, Any]]:
        """
        Train the model on the provided data.

        Args:
            X: Features array
            y: Target array
            feature_info: Dictionary with feature information

        Returns:
            Tuple of (trained_model, training_history)
        """
        logger.info("Starting model training")

        try:
            # Split data into train and validation sets
            X_train, X_val, y_train, y_val = train_test_split(
                X, y,
                test_size=self.config['training']['validation_split'],
                random_state=self.config['training']['random_state']
            )

            logger.info(f"Train set size: {X_train.shape[0]}, Validation set size: {X_val.shape[0]}")

            # Build model
            self.model = self.build_model(
                input_shape=X_train.shape[1],
                output_shape=y_train.shape[1],
                feature_info=feature_info
            )

            # Create callbacks
            callbacks = [
                EarlyStopping(
                    monitor='val_loss',
                    patience=self.config['training']['early_stopping_patience'],
                    restore_best_weights=True
                ),
                ModelCheckpoint(
                    filepath=self.get_model_path('best_model'),
                    monitor='val_loss',
                    save_best_only=True,
                    save_weights_only=False
                ),
                ReduceLROnPlateau(
                    monitor='val_loss',
                    factor=self.config['training']['reduce_lr_factor'],
                    patience=self.config['training']['reduce_lr_patience'],
                    min_lr=self.config['training']['min_learning_rate']
                )
            ]

            # Train model
            history = self.model.fit(
                X_train, y_train,
                validation_data=(X_val, y_val),
                epochs=self.config['training']['epochs'],
                batch_size=self.config['training']['batch_size'],
                callbacks=callbacks,
                verbose=1
            )

            # Evaluate on validation set
            val_predictions = self.model.predict(X_val)
            val_metrics = self.calculate_metrics(y_val, val_predictions)

            logger.info("Training completed")
            logger.info(f"Validation metrics: {val_metrics}")

            return self.model, {
                'history': history.history,
                'val_metrics': val_metrics,
                'feature_info': feature_info
            }
        except Exception as e:
            logger.error(f"Failed to train model: {str(e)}")
            raise

    def calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """
        Calculate evaluation metrics.

        Args:
            y_true: True target values
            y_pred: Predicted target values

        Returns:
            Dictionary of metrics
        """
        metrics = {}

        for i, target in enumerate(self.target_columns):
            mae = mean_absolute_error(y_true[:, i], y_pred[:, i])
            mse = mean_squared_error(y_true[:, i], y_pred[:, i])
            rmse = np.sqrt(mse)
            r2 = r2_score(y_true[:, i], y_pred[:, i])

            metrics[f'{target}_mae'] = mae
            metrics[f'{target}_mse'] = mse
            metrics[f'{target}_rmse'] = rmse
            metrics[f'{target}_r2'] = r2

        # Calculate overall metrics
        metrics['overall_mae'] = mean_absolute_error(y_true, y_pred)
        metrics['overall_mse'] = mean_squared_error(y_true, y_pred)
        metrics['overall_rmse'] = np.sqrt(metrics['overall_mse'])

        return metrics

    def save_model(self, model: Model, training_history: Dict[str, Any]) -> str:
        """
        Save the trained model and related artifacts.

        Args:
            model: Trained Keras model
            training_history: Training history and metrics

        Returns:
            Path to the saved model directory
        """
        try:
            # Create model directory
            model_dir = self.get_model_path()
            os.makedirs(model_dir, exist_ok=True)

            # Save model
            model_path = os.path.join(model_dir, 'model.h5')
            model.save(model_path)

            # Save preprocessor
            preprocessor_path = os.path.join(model_dir, 'preprocessor.pkl')
            joblib.dump(self.preprocessor, preprocessor_path)

            # Save feature info
            feature_info_path = os.path.join(model_dir, 'feature_info.json')
            with open(feature_info_path, 'w') as f:
                json.dump(training_history['feature_info'], f)

            # Save training history
            history_path = os.path.join(model_dir, 'training_history.json')
            with open(history_path, 'w') as f:
                json.dump(training_history['history'], f)

           