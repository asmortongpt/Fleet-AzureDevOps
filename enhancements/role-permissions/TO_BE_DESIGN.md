# TO_BE_DESIGN.md - Role-Permissions Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Author:** Enterprise Architecture Team

---

## Executive Vision (120 lines)

### Strategic Vision for the Next-Generation Role-Permissions System

The enhanced role-permissions module represents a transformational leap in how our enterprise manages access control, moving from a static, rule-based system to a dynamic, intelligent platform that anticipates user needs while maintaining ironclad security. This evolution aligns with our digital transformation strategy to create a "self-driving" access control system that reduces administrative overhead by 70% while improving security posture by 40%.

#### Business Transformation Goals

1. **Administrative Efficiency Revolution**
   - Reduce role assignment time from 3-5 days to real-time provisioning
   - Decrease permission-related support tickets by 80% through self-service capabilities
   - Implement AI-driven role recommendations that reduce misconfigurations by 95%

2. **Security Posture Modernization**
   - Transition from static permissions to behavior-based access control
   - Implement continuous authentication with risk-based permission adjustments
   - Achieve zero-trust architecture compliance with dynamic policy enforcement

3. **User Experience Transformation**
   - Replace permission request forms with conversational AI interfaces
   - Implement just-in-time permission elevation with automatic expiration
   - Create personalized permission dashboards with proactive suggestions

4. **Compliance Innovation**
   - Automate audit trail generation with blockchain-backed immutability
   - Implement real-time compliance monitoring with automated remediation
   - Create "compliance as code" with version-controlled policy definitions

#### Competitive Advantages

1. **First-Mover in Adaptive Access Control**
   - Industry-first implementation of reinforcement learning for permission optimization
   - Patented behavioral biometrics integration for continuous authentication
   - Unique "permission DNA" system that evolves with organizational changes

2. **Unmatched Scalability**
   - Horizontal scaling to support 10M+ concurrent users
   - Sub-100ms response times for permission checks at global scale
   - Multi-region deployment with active-active failover

3. **Developer Experience Differentiation**
   - GraphQL API for permission queries with 90% fewer roundtrips
   - SDKs for 12+ languages with built-in permission checking
   - "Permission as a Service" with serverless deployment options

4. **Future-Proof Architecture**
   - Quantum-resistant cryptography for long-term security
   - Blockchain integration for audit trail immutability
   - Edge computing support for latency-sensitive applications

#### Long-Term Roadmap (2023-2026)

**Phase 1: Foundation (Q4 2023)**
- Core permission engine rewrite with TypeScript
- Redis caching layer implementation
- Basic WebSocket real-time updates
- Initial AI recommendation engine

**Phase 2: Intelligence (2024)**
- Predictive permission modeling
- Continuous authentication integration
- Advanced gamification system
- First-party analytics dashboards

**Phase 3: Autonomy (2025)**
- Self-optimizing permission system
- Autonomous policy generation
- Cross-platform identity unification
- Quantum-ready cryptography

**Phase 4: Ecosystem (2026)**
- Permission marketplace
- Developer platform for custom integrations
- Industry-standard protocol adoption
- Global compliance network

#### Organizational Impact

1. **IT Operations**
   - 60% reduction in access-related helpdesk tickets
   - 90% faster onboarding for new applications
   - Automated permission recertification processes

2. **Security Team**
   - Real-time threat detection through permission anomalies
   - Automated policy violation remediation
   - Continuous compliance monitoring

3. **Business Units**
   - Faster time-to-value for new initiatives
   - Reduced shadow IT through better self-service
   - Improved collaboration through granular sharing controls

4. **End Users**
   - One-click permission requests
   - Personalized permission recommendations
   - Gamified security awareness

#### Success Metrics

| KPI | Baseline | Target (12mo) | Target (24mo) | Measurement Method |
|-----|----------|---------------|---------------|--------------------|
| Permission Check Latency | 450ms | <100ms | <50ms | Synthetic monitoring |
| Role Assignment Time | 3.2 days | <1 hour | Real-time | Audit logs |
| Permission-Related Tickets | 1,200/mo | <200/mo | <50/mo | Helpdesk system |
| Audit Completion Time | 14 days | <2 days | <1 day | Compliance reports |
| User Satisfaction (NPS) | 32 | 65 | 80 | Quarterly surveys |
| Security Incidents | 48/yr | <12/yr | <5/yr | SIEM alerts |

#### Investment Justification

The enhanced role-permissions system delivers a 4.7x ROI within 36 months through:
- $2.1M annual savings in IT operations costs
- $1.8M reduction in compliance-related expenses
- $3.2M productivity gains from faster access provisioning
- $0.9M reduction in security incident response costs
- $1.5M new revenue from permission-as-a-service offerings

The system's modular architecture ensures incremental value delivery, with each component providing standalone benefits while contributing to the overall platform vision.

---

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// src/cache/permission-cache.ts
import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger';
import { PermissionCheckResult, RoleDefinition } from '../types/permission-types';
import { CacheConfig } from '../config/cache-config';

export class PermissionCache {
    private static instance: PermissionCache;
    private client: RedisClientType;
    private logger: Logger;
    private config: CacheConfig;
    private isReady: boolean = false;

    private constructor() {
        this.logger = new Logger('PermissionCache');
        this.config = new CacheConfig();

        this.client = createClient({
            url: this.config.redisUrl,
            socket: {
                tls: this.config.useTls,
                rejectUnauthorized: false,
                reconnectStrategy: (retries) => Math.min(retries * 100, 5000)
            },
            password: this.config.redisPassword,
            database: this.config.databaseIndex
        });

        this.initialize();
    }

    public static getInstance(): PermissionCache {
        if (!PermissionCache.instance) {
            PermissionCache.instance = new PermissionCache();
        }
        return PermissionCache.instance;
    }

    private async initialize(): Promise<void> {
        try {
            this.client.on('error', (err) => this.logger.error('Redis error', err));
            this.client.on('connect', () => this.logger.info('Redis connected'));
            this.client.on('ready', () => {
                this.isReady = true;
                this.logger.info('Redis ready');
            });
            this.client.on('reconnecting', () => this.logger.warn('Redis reconnecting'));

            await this.client.connect();
            await this.setupIndices();
        } catch (error) {
            this.logger.error('Redis initialization failed', error);
            throw error;
        }
    }

    private async setupIndices(): Promise<void> {
        try {
            // Create secondary indices for faster lookups
            await this.client.ft.create(
                'idx:permissions',
                {
                    'userId': {
                        type: 'TAG',
                        SORTABLE: true
                    },
                    'resource': {
                        type: 'TAG',
                        SORTABLE: true
                    },
                    'action': {
                        type: 'TAG',
                        SORTABLE: true
                    },
                    'expiry': {
                        type: 'NUMERIC',
                        SORTABLE: true
                    }
                },
                {
                    ON: 'HASH',
                    PREFIX: 'perm:'
                }
            );

            await this.client.ft.create(
                'idx:roles',
                {
                    'roleName': {
                        type: 'TAG',
                        SORTABLE: true
                    },
                    'isActive': {
                        type: 'TAG',
                        SORTABLE: true
                    },
                    'createdAt': {
                        type: 'NUMERIC',
                        SORTABLE: true
                    }
                },
                {
                    ON: 'HASH',
                    PREFIX: 'role:'
                }
            );
        } catch (error) {
            if (error.message.includes('Index already exists')) {
                this.logger.info('Redis indices already exist');
            } else {
                this.logger.error('Failed to create Redis indices', error);
                throw error;
            }
        }
    }

    public async cachePermissionCheck(
        userId: string,
        resource: string,
        action: string,
        result: PermissionCheckResult,
        ttl: number = this.config.defaultTtl
    ): Promise<void> {
        if (!this.isReady) {
            this.logger.warn('Cache not ready, skipping permission cache');
            return;
        }

        try {
            const cacheKey = `perm:${userId}:${resource}:${action}`;
            const cacheValue = {
                ...result,
                cachedAt: Date.now(),
                ttl
            };

            await this.client.hSet(cacheKey, cacheValue);
            await this.client.expire(cacheKey, ttl);

            // Also cache in the user's permission set for faster access
            const userPermKey = `user:${userId}:perms`;
            await this.client.sAdd(userPermKey, cacheKey);
            await this.client.expire(userPermKey, ttl);
        } catch (error) {
            this.logger.error('Failed to cache permission check', error);
        }
    }

    public async getCachedPermission(
        userId: string,
        resource: string,
        action: string
    ): Promise<PermissionCheckResult | null> {
        if (!this.isReady) {
            return null;
        }

        try {
            const cacheKey = `perm:${userId}:${resource}:${action}`;
            const cachedResult = await this.client.hGetAll(cacheKey);

            if (!cachedResult || Object.keys(cachedResult).length === 0) {
                return null;
            }

            // Check if the cache entry has expired
            const cachedAt = parseInt(cachedResult.cachedAt);
            const ttl = parseInt(cachedResult.ttl);
            if (Date.now() - cachedAt > ttl * 1000) {
                await this.client.del(cacheKey);
                return null;
            }

            return {
                allowed: cachedResult.allowed === 'true',
                reason: cachedResult.reason,
                context: JSON.parse(cachedResult.context || '{}'),
                expiresAt: new Date(parseInt(cachedResult.expiresAt))
            };
        } catch (error) {
            this.logger.error('Failed to retrieve cached permission', error);
            return null;
        }
    }

    public async cacheRoleDefinition(
        roleId: string,
        roleDefinition: RoleDefinition,
        ttl: number = this.config.defaultTtl
    ): Promise<void> {
        if (!this.isReady) {
            return;
        }

        try {
            const cacheKey = `role:${roleId}`;
            const cacheValue = {
                ...roleDefinition,
                cachedAt: Date.now()
            };

            await this.client.hSet(cacheKey, cacheValue);
            await this.client.expire(cacheKey, ttl);

            // Cache role name to ID mapping
            await this.client.set(`roleName:${roleDefinition.name}`, roleId, {
                EX: ttl
            });
        } catch (error) {
            this.logger.error('Failed to cache role definition', error);
        }
    }

    public async getCachedRoleDefinition(roleId: string): Promise<RoleDefinition | null> {
        if (!this.isReady) {
            return null;
        }

        try {
            const cacheKey = `role:${roleId}`;
            const cachedRole = await this.client.hGetAll(cacheKey);

            if (!cachedRole || Object.keys(cachedRole).length === 0) {
                return null;
            }

            return {
                id: cachedRole.id,
                name: cachedRole.name,
                description: cachedRole.description,
                permissions: JSON.parse(cachedRole.permissions || '[]'),
                isActive: cachedRole.isActive === 'true',
                createdAt: new Date(cachedRole.createdAt),
                updatedAt: new Date(cachedRole.updatedAt)
            };
        } catch (error) {
            this.logger.error('Failed to retrieve cached role', error);
            return null;
        }
    }

    public async invalidateUserPermissions(userId: string): Promise<void> {
        if (!this.isReady) {
            return;
        }

        try {
            // Get all permission keys for this user
            const userPermKey = `user:${userId}:perms`;
            const permissionKeys = await this.client.sMembers(userPermKey);

            // Delete all permission entries
            if (permissionKeys.length > 0) {
                await this.client.del(permissionKeys);
            }

            // Delete the user's permission set
            await this.client.del(userPermKey);

            // Invalidate any role assignments
            const roleAssignments = await this.client.sMembers(`user:${userId}:roles`);
            for (const roleId of roleAssignments) {
                await this.client.del(`role:${roleId}`);
            }
            await this.client.del(`user:${userId}:roles`);
        } catch (error) {
            this.logger.error('Failed to invalidate user permissions', error);
        }
    }

    public async close(): Promise<void> {
        try {
            await this.client.quit();
            this.isReady = false;
        } catch (error) {
            this.logger.error('Failed to close Redis connection', error);
        }
    }
}
```

### Database Query Optimization

```typescript
// src/database/permission-repository.ts
import { Pool, PoolClient, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { PermissionCheckResult, RoleAssignment, UserPermission } from '../types/permission-types';
import { DatabaseConfig } from '../config/database-config';
import { PermissionCache } from '../cache/permission-cache';

export class PermissionRepository {
    private pool: Pool;
    private logger: Logger;
    private cache: PermissionCache;
    private config: DatabaseConfig;

    constructor() {
        this.logger = new Logger('PermissionRepository');
        this.config = new DatabaseConfig();
        this.cache = PermissionCache.getInstance();

        this.pool = new Pool({
            user: this.config.username,
            host: this.config.host,
            database: this.config.database,
            password: this.config.password,
            port: this.config.port,
            max: this.config.maxConnections,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout
        });

        this.pool.on('error', (err) => {
            this.logger.error('Unexpected database error', err);
        });
    }

    private async getClient(): Promise<PoolClient> {
        try {
            return await this.pool.connect();
        } catch (error) {
            this.logger.error('Failed to get database client', error);
            throw error;
        }
    }

    public async checkPermission(
        userId: string,
        resource: string,
        action: string
    ): Promise<PermissionCheckResult> {
        // First check cache
        const cachedResult = await this.cache.getCachedPermission(userId, resource, action);
        if (cachedResult) {
            this.logger.debug('Permission check served from cache', { userId, resource, action });
            return cachedResult;
        }

        const client = await this.getClient();
        try {
            // Use optimized query with proper indexing
            const query = `
                WITH user_roles AS (
                    SELECT r.id, r.permissions
                    FROM role_assignments ra
                    JOIN roles r ON ra.role_id = r.id
                    WHERE ra.user_id = $1
                    AND ra.is_active = true
                    AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
                ),
                direct_permissions AS (
                    SELECT p.allowed, p.reason, p.context, p.expires_at
                    FROM user_permissions p
                    WHERE p.user_id = $1
                    AND p.resource = $2
                    AND p.action = $3
                    AND p.is_active = true
                    AND (p.expires_at IS NULL OR p.expires_at > NOW())
                    ORDER BY p.created_at DESC
                    LIMIT 1
                )
                SELECT
                    COALESCE(
                        (SELECT allowed FROM direct_permissions),
                        (SELECT bool_or(r.permissions @> jsonb_build_array($2 || ':' || $3))
                         FROM user_roles r)
                    ) AS allowed,
                    COALESCE(
                        (SELECT reason FROM direct_permissions),
                        (SELECT 'Role-based permission' FROM user_roles WHERE bool_or(r.permissions @> jsonb_build_array($2 || ':' || $3)))
                    ) AS reason,
                    COALESCE(
                        (SELECT context FROM direct_permissions),
                        (SELECT jsonb_object_agg(r.id, r.permissions) FROM user_roles r)
                    ) AS context,
                    COALESCE(
                        (SELECT expires_at FROM direct_permissions),
                        (SELECT MIN(ra.expires_at) FROM role_assignments ra JOIN user_roles ur ON ra.role_id = ur.id)
                    ) AS expires_at
                FROM (SELECT 1) AS dummy;
            `;

            const result = await client.query(query, [userId, resource, action]);

            if (result.rows.length === 0 || result.rows[0].allowed === null) {
                return {
                    allowed: false,
                    reason: 'No permission found',
                    context: {},
                    expiresAt: new Date(Date.now() + 3600000) // Default 1 hour expiry
                };
            }

            const checkResult: PermissionCheckResult = {
                allowed: result.rows[0].allowed,
                reason: result.rows[0].reason || 'Permission granted',
                context: result.rows[0].context || {},
                expiresAt: result.rows[0].expires_at || new Date(Date.now() + 3600000)
            };

            // Cache the result
            await this.cache.cachePermissionCheck(
                userId,
                resource,
                action,
                checkResult,
                Math.floor((checkResult.expiresAt.getTime() - Date.now()) / 1000)
            );

            return checkResult;
        } catch (error) {
            this.logger.error('Permission check failed', error);
            throw error;
        } finally {
            client.release();
        }
    }

    public async getUserPermissions(userId: string): Promise<UserPermission[]> {
        // Check cache first
        const cacheKey = `user:${userId}:all_perms`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const client = await this.getClient();
        try {
            const query = `
                WITH role_permissions AS (
                    SELECT
                        r.id AS role_id,
                        r.name AS role_name,
                        jsonb_array_elements(r.permissions) AS permission
                    FROM role_assignments ra
                    JOIN roles r ON ra.role_id = r.id
                    WHERE ra.user_id = $1
                    AND ra.is_active = true
                    AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
                ),
                direct_permissions AS (
                    SELECT
                        p.resource,
                        p.action,
                        p.allowed,
                        p.reason,
                        p.context,
                        p.expires_at
                    FROM user_permissions p
                    WHERE p.user_id = $1
                    AND p.is_active = true
                    AND (p.expires_at IS NULL OR p.expires_at > NOW())
                )
                SELECT
                    COALESCE(dp.resource, (regexp_split_to_array(rp.permission::text, ':'))[1]) AS resource,
                    COALESCE(dp.action, (regexp_split_to_array(rp.permission::text, ':'))[2]) AS action,
                    COALESCE(dp.allowed, true) AS allowed,
                    COALESCE(dp.reason, 'Role-based permission') AS reason,
                    COALESCE(dp.context, '{}'::jsonb) AS context,
                    COALESCE(dp.expires_at, ra.expires_at) AS expires_at,
                    CASE
                        WHEN dp.resource IS NOT NULL THEN 'direct'
                        ELSE 'role'
                    END AS source_type,
                    rp.role_id,
                    rp.role_name
                FROM role_permissions rp
                LEFT JOIN direct_permissions dp ON
                    (regexp_split_to_array(rp.permission::text, ':'))[1] = dp.resource AND
                    (regexp_split_to_array(rp.permission::text, ':'))[2] = dp.action
                LEFT JOIN role_assignments ra ON rp.role_id = ra.role_id AND ra.user_id = $1
                UNION ALL
                SELECT
                    dp.resource,
                    dp.action,
                    dp.allowed,
                    dp.reason,
                    dp.context,
                    dp.expires_at,
                    'direct' AS source_type,
                    NULL AS role_id,
                    NULL AS role_name
                FROM direct_permissions dp
                WHERE NOT EXISTS (
                    SELECT 1 FROM role_permissions rp
                    WHERE (regexp_split_to_array(rp.permission::text, ':'))[1] = dp.resource AND
                          (regexp_split_to_array(rp.permission::text, ':'))[2] = dp.action
                )
                ORDER BY resource, action;
            `;

            const result = await client.query(query, [userId]);

            const permissions: UserPermission[] = result.rows.map(row => ({
                resource: row.resource,
                action: row.action,
                allowed: row.allowed,
                reason: row.reason,
                context: row.context,
                expiresAt: row.expires_at,
                sourceType: row.source_type,
                roleId: row.role_id,
                roleName: row.role_name
            }));

            // Cache the result with 5 minute TTL
            await this.cache.setex(cacheKey, 300, JSON.stringify(permissions));

            return permissions;
        } catch (error) {
            this.logger.error('Failed to get user permissions', error);
            throw error;
        } finally {
            client.release();
        }
    }

    public async assignRoleToUser(
        userId: string,
        roleId: string,
        expiresAt?: Date,
        assignedBy?: string
    ): Promise<RoleAssignment> {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');

            // Check if role exists and is active
            const roleCheck = await client.query(
                'SELECT id, is_active FROM roles WHERE id = $1 FOR UPDATE',
                [roleId]
            );

            if (roleCheck.rows.length === 0) {
                throw new Error('Role not found');
            }

            if (!roleCheck.rows[0].is_active) {
                throw new Error('Role is not active');
            }

            // Check for existing assignment
            const existingAssignment = await client.query(
                `SELECT id FROM role_assignments
                 WHERE user_id = $1 AND role_id = $2 AND is_active = true
                 FOR UPDATE`,
                [userId, roleId]
            );

            if (existingAssignment.rows.length > 0) {
                // Update existing assignment
                const updateQuery = `
                    UPDATE role_assignments
                    SET expires_at = $1, updated_at = NOW(), updated_by = $2
                    WHERE id = $3
                    RETURNING *
                `;
                const result = await client.query(updateQuery, [
                    expiresAt,
                    assignedBy || 'system',
                    existingAssignment.rows[0].id
                ]);

                await client.query('COMMIT');
                await this.cache.invalidateUserPermissions(userId);
                return this.mapRoleAssignment(result.rows[0]);
            }

            // Create new assignment
            const insertQuery = `
                INSERT INTO role_assignments
                (user_id, role_id, expires_at, assigned_by, updated_by)
                VALUES ($1, $2, $3, $4, $4)
                RETURNING *
            `;
            const result = await client.query(insertQuery, [
                userId,
                roleId,
                expiresAt,
                assignedBy || 'system'
            ]);

            await client.query('COMMIT');
            await this.cache.invalidateUserPermissions(userId);
            return this.mapRoleAssignment(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Failed to assign role to user', error);
            throw error;
        } finally {
            client.release();
        }
    }

    private mapRoleAssignment(row: any): RoleAssignment {
        return {
            id: row.id,
            userId: row.user_id,
            roleId: row.role_id,
            assignedAt: row.assigned_at,
            expiresAt: row.expires_at,
            isActive: row.is_active,
            assignedBy: row.assigned_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by
        };
    }

    public async batchCheckPermissions(
        checks: Array<{ userId: string; resource: string; action: string }>
    ): Promise<PermissionCheckResult[]> {
        if (checks.length === 0) {
            return [];
        }

        // First check cache for all requests
        const cacheResults = await Promise.all(
            checks.map(check => this.cache.getCachedPermission(check.userId, check.resource, check.action))
        );

        // Filter out cached results
        const uncachedChecks = checks.filter((_, index) => !cacheResults[index]);
        if (uncachedChecks.length === 0) {
            return cacheResults as PermissionCheckResult[];
        }

        const client = await this.getClient();
        try {
            // Use a single query for all uncached checks
            const query = `
                WITH user_roles AS (
                    SELECT
                        ra.user_id,
                        r.id AS role_id,
                        r.permissions
                    FROM role_assignments ra
                    JOIN roles r ON ra.role_id = r.id
                    WHERE ra.user_id = ANY($1::text[])
                    AND ra.is_active = true
                    AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
                ),
                direct_permissions AS (
                    SELECT
                        p.user_id,
                        p.resource,
                        p.action,
                        p.allowed,
                        p.reason,
                        p.context,
                        p.expires_at
                    FROM user_permissions p
                    WHERE (p.user_id, p.resource, p.action) IN (
                        SELECT * FROM unnest($1::text[], $2::text[], $3::text[])
                    )
                    AND p.is_active = true
                    AND (p.expires_at IS NULL OR p.expires_at > NOW())
                ),
                check_requests AS (
                    SELECT * FROM unnest($1::text[], $2::text[], $3::text[])
                    AS t(user_id, resource, action)
                )
                SELECT
                    cr.user_id,
                    cr.resource,
                    cr.action,
                    COALESCE(
                        (SELECT allowed FROM direct_permissions dp
                         WHERE dp.user_id = cr.user_id AND dp.resource = cr.resource AND dp.action = cr.action),
                        (SELECT bool_or(ur.permissions @> jsonb_build_array(cr.resource || ':' || cr.action))
                         FROM user_roles ur WHERE ur.user_id = cr.user_id)
                    ) AS allowed,
                    COALESCE(
                        (SELECT reason FROM direct_permissions dp
                         WHERE dp.user_id = cr.user_id AND dp.resource = cr.resource AND dp.action = cr.action),
                        (SELECT 'Role-based permission'
                         FROM user_roles ur
                         WHERE ur.user_id = cr.user_id AND bool_or(ur.permissions @> jsonb_build_array(cr.resource || ':' || cr.action)))
                    ) AS reason,
                    COALESCE(
                        (SELECT context FROM direct_permissions dp
                         WHERE dp.user_id = cr.user_id AND dp.resource = cr.resource AND dp.action = cr.action),
                        (SELECT jsonb_object_agg(ur.role_id, ur.permissions)
                         FROM user_roles ur WHERE ur.user_id = cr.user_id)
                    ) AS context,
                    COALESCE(
                        (SELECT expires_at FROM direct_permissions dp
                         WHERE dp.user_id = cr.user_id AND dp.resource = cr.resource AND dp.action = cr.action),
                        (SELECT MIN(ra.expires_at)
                         FROM role_assignments ra JOIN user_roles ur ON ra.role_id = ur.role_id
                         WHERE ra.user_id = cr.user_id)
                    ) AS expires_at
                FROM check_requests cr;
            `;

            const userIds = uncachedChecks.map(c => c.userId);
            const resources = uncachedChecks.map(c => c.resource);
            const actions = uncachedChecks.map(c => c.action);

            const result = await client.query(query, [userIds, resources, actions]);

            const dbResults = result.rows.map(row => ({
                userId: row.user_id,
                resource: row.resource,
                action: row.action,
                result: {
                    allowed: row.allowed,
                    reason: row.reason || 'Permission granted',
                    context: row.context || {},
                    expiresAt: row.expires_at || new Date(Date.now() + 3600000)
                }
            }));

            // Combine cached and database results
            const finalResults: PermissionCheckResult[] = [];
            let dbIndex = 0;

            for (let i = 0; i < checks.length; i++) {
                if (cacheResults[i]) {
                    finalResults.push(cacheResults[i] as PermissionCheckResult);
                } else {
                    const dbResult = dbResults[dbIndex++];
                    if (dbResult.userId === checks[i].userId &&
                        dbResult.resource === checks[i].resource &&
                        dbResult.action === checks[i].action) {
                        finalResults.push(dbResult.result);

                        // Cache the result
                        await this.cache.cachePermissionCheck(
                            dbResult.userId,
                            dbResult.resource,
                            dbResult.action,
                            dbResult.result,
                            Math.floor((dbResult.result.expiresAt.getTime() - Date.now()) / 1000)
                        );
                    } else {
                        // Fallback for unexpected results
                        finalResults.push({
                            allowed: false,
                            reason: 'Permission check failed',
                            context: {},
                            expiresAt: new Date(Date.now() + 3600000)
                        });
                    }
                }
            }

            return finalResults;
        } catch (error) {
            this.logger.error('Batch permission check failed', error);
            throw error;
        } finally {
            client.release();
        }
    }

    public async close(): Promise<void> {
        try {
            await this.pool.end();
        } catch (error) {
            this.logger.error('Failed to close database connection pool', error);
        }
    }
}
```

### API Response Compression

```typescript
// src/middleware/response-compression.ts
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { Logger } from '../utils/logger';
import zlib from 'zlib';

export class ResponseCompression {
    private static instance: ResponseCompression;
    private logger: Logger;
    private compressionMiddleware: (req: Request, res: Response, next: NextFunction) => void;

    private constructor() {
        this.logger = new Logger('ResponseCompression');

        // Custom compression filter to handle different content types
        const shouldCompress = (req: Request, res: Response): boolean => {
            if (req.headers['x-no-compression']) {
                return false;
            }

            // Don't compress binary data or already compressed content
            const contentType = res.getHeader('Content-Type') as string;
            if (contentType) {
                if (contentType.includes('application/octet-stream') ||
                    contentType.includes('image/') ||
                    contentType.includes('video/') ||
                    contentType.includes('audio/') ||
                    contentType.includes('zip') ||
                    contentType.includes('gzip') ||
                    contentType.includes('compressed')) {
                    return false;
                }
            }

            // Don't compress small responses
            const acceptEncoding = req.headers['accept-encoding'] as string;
            if (!acceptEncoding || !acceptEncoding.includes('gzip')) {
                return false;
            }

            return true;
        };

        // Custom compression options
        const compressionOptions = {
            filter: shouldCompress,
            threshold: 1024, // Only compress responses larger than 1KB
            level: zlib.constants.Z_BEST_COMPRESSION,
            strategy: zlib.constants.Z_DEFAULT_STRATEGY,
            chunkSize: 16 * 1024, // 16KB chunks
            windowBits: 15,
            memLevel: 8
        };

        this.compressionMiddleware = compression(compressionOptions);

        // Add performance monitoring
        this.setupMonitoring();
    }

    public static getInstance(): ResponseCompression {
        if (!ResponseCompression.instance) {
            ResponseCompression.instance = new ResponseCompression();
        }
        return ResponseCompression.instance;
    }

    public getMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
        return this.compressionMiddleware;
    }

    private setupMonitoring(): void {
        // Add response size tracking
        const originalWrite = zlib.Gzip.prototype.write;
        zlib.Gzip.prototype.write = function(chunk: any) {
            if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
                const size = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
                this.bytesIn = (this.bytesIn || 0) + size;
            }
            return originalWrite.call(this, chunk);
        };

        const originalFlush = zlib.Gzip.prototype.flush;
        zlib.Gzip.prototype.flush = function(cb: any) {
            const result = originalFlush.call(this, cb);
            if (this.bytesIn) {
                const compressedSize = this.bytesWritten || 0;
                const ratio = this.bytesIn / compressedSize;
                this.logger.debug('Compression stats', {
                    bytesIn: this.bytesIn,
                    bytesOut: compressedSize,
                    ratio: ratio.toFixed(2)
                });
            }
            return result;
        };
    }

    public async compressResponse(
        data: any,
        req: Request,
        res: Response
    ): Promise<Buffer | string> {
        return new Promise((resolve, reject) => {
            if (!shouldCompress(req, res)) {
                return resolve(JSON.stringify(data));
            }

            const acceptEncoding = req.headers['accept-encoding'] as string;
            const useBrotli = acceptEncoding && acceptEncoding.includes('br');

            try {
                const jsonData = JSON.stringify(data);

                if (useBrotli) {
                    zlib.brotliCompress(jsonData, {
                        params: {
                            [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
                            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: jsonData.length
                        }
                    }, (err, result) => {
                        if (err) {
                            this.logger.error('Brotli compression failed', err);
                            return reject(err);
                        }
                        res.setHeader('Content-Encoding', 'br');
                        resolve(result);
                    });
                } else {
                    zlib.gzip(jsonData, {
                        level: zlib.constants.Z_BEST_COMPRESSION,
                        strategy: zlib.constants.Z_DEFAULT_STRATEGY
                    }, (err, result) => {
                        if (err) {
                            this.logger.error('Gzip compression failed', err);
                            return reject(err);
                        }
                        res.setHeader('Content-Encoding', 'gzip');
                        resolve(result);
                    });
                }
            } catch (error) {
                this.logger.error('Response compression failed', error);
                reject(error);
            }
        });
    }

    public async compressStream(
        stream: NodeJS.ReadableStream,
        req: Request,
        res: Response
    ): Promise<NodeJS.ReadableStream> {
        if (!shouldCompress(req, res)) {
            return stream;
        }

        const acceptEncoding = req.headers['accept-encoding'] as string;
        const useBrotli = acceptEncoding && acceptEncoding.includes('br');

        res.setHeader('Content-Encoding', useBrotli ? 'br' : 'gzip');

        if (useBrotli) {
            return stream.pipe(zlib.createBrotliCompress({
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY
                }
            }));
        } else {
            return stream.pipe(zlib.createGzip({
                level: zlib.constants.Z_BEST_COMPRESSION
            }));
        }
    }
}
```

### Lazy Loading Implementation

```typescript
// src/utils/lazy-loader.ts
import { Logger } from './logger';
import { PermissionCache } from '../cache/permission-cache';
import { PermissionRepository } from '../database/permission-repository';

export class LazyLoader {
    private static instance: LazyLoader;
    private logger: Logger;
    private cache: PermissionCache;
    private repository: PermissionRepository;
    private loadingPromises: Map<string, Promise<any>>;
    private loadedResources: Map<string, any>;
    private ttlTimers: Map<string, NodeJS.Timeout>;

    private constructor() {
        this.logger = new Logger('LazyLoader');
        this.cache = PermissionCache.getInstance();
        this.repository = new PermissionRepository();
        this.loadingPromises = new Map();
        this.loadedResources = new Map();
        this.ttlTimers = new Map();
    }

    public static getInstance(): LazyLoader {
        if (!LazyLoader.instance) {
            LazyLoader.instance = new LazyLoader();
        }
        return LazyLoader.instance;
    }

    public async loadResource<T>(
        key: string,
        loader: () => Promise<T>,
        ttl: number = 300000 // 5 minutes default
    ): Promise<T> {
        // Check if already loaded
        if (this.loadedResources.has(key)) {
            const resource = this.loadedResources.get(key);
            this.resetTtlTimer(key, ttl);
            return resource;
        }

        // Check if currently loading
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key) as Promise<T>;
        }

        // Create loading promise
        const loadingPromise = loader()
            .then(resource => {
                this.loadedResources.set(key, resource);
                this.resetTtlTimer(key, ttl);
                this.loadingPromises.delete(key);
                return resource;
            })
            .catch(error => {
                this.loadingPromises.delete(key);
                this.logger.error(`Failed to load resource ${key}`, error);
                throw error;
            });

        this.loadingPromises.set(key, loadingPromise);
        return loadingPromise;
    }

    public async loadUserPermissions(userId: string): Promise<any> {
        const cacheKey = `lazy:user:${userId}:perms`;
        return this.loadResource(
            cacheKey,
            async () => {
                this.logger.debug(`Loading permissions for user ${userId}`);
                const permissions = await this.repository.getUserPermissions(userId);

                // Also cache in Redis for other services
                await this.cache.setex(
                    `user:${userId}:perms:lazy`,
                    300,
                    JSON.stringify(permissions)
                );

                return permissions;
            },
            300000 // 5 minutes
        );
    }

    public async loadRoleDefinition(roleId: string): Promise<any> {
        const cacheKey = `lazy:role:${roleId}`;
        return this.loadResource(
            cacheKey,
            async () => {
                this.logger.debug(`Loading role definition ${roleId}`);
                const cachedRole = await this.cache.getCachedRoleDefinition(roleId);
                if (cachedRole) {
                    return cachedRole;
                }

                // Fallback to database
                const client = await this.repository.getClient();
                try {
                    const result = await client.query(
                        'SELECT * FROM roles WHERE id = $1',
                        [roleId]
                    );

                    if (result.rows.length === 0) {
                        throw new Error(`Role ${roleId} not found`);
                    }

                    const role = {
                        id: result.rows[0].id,
                        name: result.rows[0].name,
                        description: result.rows[0].description,
                        permissions: result.rows[0].permissions,
                        isActive: result.rows[0].is_active,
                        createdAt: result.rows[0].created_at,
                        updatedAt: result.rows[0].updated_at
                    };

                    // Cache in Redis
                    await this.cache.cacheRoleDefinition(roleId, role);

                    return role;
                } finally {
                    client.release();
                }
            },
            600000 // 10 minutes
        );
    }

    public async loadUserRoles(userId: string): Promise<any> {
        const cacheKey = `lazy:user:${userId}:roles`;
        return this.loadResource(
            cacheKey,
            async () => {
                this.logger.debug(`Loading roles for user ${userId}`);
                const client = await this.repository.getClient();
                try {
                    const result = await client.query(
                        `SELECT ra.id, ra.role_id, ra.assigned_at, ra.expires_at, ra.is_active,
                                r.name, r.description, r.permissions
                         FROM role_assignments ra
                         JOIN roles r ON ra.role_id = r.id
                         WHERE ra.user_id = $1 AND ra.is_active = true
                         AND (ra.expires_at IS NULL OR ra.expires_at > NOW())`,
                        [userId]
                    );

                    const roles = result.rows.map(row => ({
                        assignmentId: row.id,
                        roleId: row.role_id,
                        roleName: row.name,
                        description: row.description,
                        permissions: row.permissions,
                        assignedAt: row.assigned_at,
                        expiresAt: row.expires_at,
                        isActive: row.is_active
                    }));

                    // Cache in Redis
                    await this.cache.setex(
                        `user:${userId}:roles:lazy`,
                        300,
                        JSON.stringify(roles)
                    );

                    return roles;
                } finally {
                    client.release();
                }
            },
            300000 // 5 minutes
        );
    }

    private resetTtlTimer(key: string, ttl: number): void {
        // Clear existing timer if present
        if (this.ttlTimers.has(key)) {
            clearTimeout(this.ttlTimers.get(key));
        }

        // Set new timer
        const timer = setTimeout(() => {
            this.loadedResources.delete(key);
            this.ttlTimers.delete(key);
            this.logger.debug(`Evicted lazy-loaded resource ${key} due to TTL expiration`);
        }, ttl);

        this.ttlTimers.set(key, timer);
    }

    public async preloadCommonResources(): Promise<void> {
        this.logger.info('Preloading common resources');

        try {
            // Preload system roles
            const client = await this.repository.getClient();
            try {
                const result = await client.query(
                    'SELECT id FROM roles WHERE is_system_role = true'
                );

                await Promise.all(
                    result.rows.map(row => this.loadRoleDefinition(row.id))
                );
            } finally {
                client.release();
            }

            // Preload common permissions
            await this.loadResource(
                'lazy:common:permissions',
                async () => {
                    const result = await client.query(
                        'SELECT resource, action FROM permissions GROUP BY resource, action'
                    );
                    return result.rows;
                },
                86400000 // 24 hours
            );
        } catch (error) {
            this.logger.error('Failed to preload common resources', error);
        }
    }

    public async clearResource(key: string): Promise<void> {
        this.loadedResources.delete(key);
        if (this.ttlTimers.has(key)) {
            clearTimeout(this.ttlTimers.get(key));
            this.ttlTimers.delete(key);
        }
        this.loadingPromises.delete(key);
    }

    public async clearAll(): Promise<void> {
        this.loadedResources.clear();
        this.ttlTimers.forEach(timer => clearTimeout(timer));
        this.ttlTimers.clear();
        this.loadingPromises.clear();
    }
}
```

### Request Debouncing

```typescript
// src/utils/request-debouncer.ts
import { Logger } from './logger';
import { PermissionCache } from '../cache/permission-cache';

export class RequestDebouncer {
    private static instance: RequestDebouncer;
    private logger: Logger;
    private cache: PermissionCache;
    private debounceTimers: Map<string, NodeJS.Timeout>;
    private pendingRequests: Map<string, Promise<any>>;

    private constructor() {
        this.logger = new Logger('RequestDebouncer');
        this.cache = PermissionCache.getInstance();
        this.debounceTimers = new Map();
        this.pendingRequests = new Map();
    }

    public static getInstance(): RequestDebouncer {
        if (!RequestDebouncer.instance) {
            RequestDebouncer.instance = new RequestDebouncer();
        }
        return RequestDebouncer.instance;
    }

    public async debounce<T>(
        key: string,
        requestFn: () => Promise<T>,
        debounceTime: number = 200,
        cacheKey?: string,
        cacheTtl?: number
    ): Promise<T> {
        // Check if there's a pending request for this key
        if (this.pendingRequests.has(key)) {
            this.logger.debug(`Returning pending request for ${key}`);
            return this.pendingRequests.get(key) as Promise<T>;
        }

        // Check cache if cacheKey is provided
        if (cacheKey) {
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                this.logger.debug(`Returning cached result for ${key}`);
                return JSON.parse(cached);
            }
        }

        // Clear any existing timer
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        // Create new debounced request
        const requestPromise = new Promise<T>((resolve, reject) => {
            this.debounceTimers.set(key, setTimeout(async () => {
                try {
                    this.logger.debug(`Executing debounced request for ${key}`);
                    const result = await requestFn();

                    // Cache the result if cacheKey is provided
                    if (cacheKey && cacheTtl) {
                        await this.cache.setex(
                            cacheKey,
                            cacheTtl,
                            JSON.stringify(result)
                        );
                    }

                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.pendingRequests.delete(key);
                    this.debounceTimers.delete(key);
                }
            }, debounceTime));
        });

        this.pendingRequests.set(key, requestPromise);
        return requestPromise;
    }

    public async debouncePermissionCheck(
        userId: string,
        resource: string,
        action: string,
        debounceTime: number = 100
    ): Promise<any> {
        const key = `perm:${userId}:${resource}:${action}`;
        const cacheKey = `perm:${userId}:${resource}:${action}:debounced`;

        return this.debounce(
            key,
            async () => {
                const cached = await this.cache.getCachedPermission(userId, resource, action);
                if (cached) {
                    return cached;
                }

                // Import here to avoid circular dependency
                const { PermissionRepository } = await import('../database/permission-repository');
                const repository = new PermissionRepository();
                return repository.checkPermission(userId, resource, action);
            },
            debounceTime,
            cacheKey,
            300 // 5 minutes cache TTL
        );
    }

    public async debounceBatchPermissionCheck(
        checks: Array<{ userId: string; resource: string; action: string }>,
        debounceTime: number = 150
    ): Promise<any[]> {
        const key = `batch:${checks.map(c => `${c.userId}:${c.resource}:${c.action}`).join(',')}`;

        return this.debounce(
            key,
            async () => {
                // Import here to avoid circular dependency
                const { PermissionRepository } = await import('../database/permission-repository');
                const repository = new PermissionRepository();
                return repository.batchCheckPermissions(checks);
            },
            debounceTime
        );
    }

    public async debounceUserPermissions(
        userId: string,
        debounceTime: number = 100
    ): Promise<any> {
        const key = `user:${userId}:perms`;
        const cacheKey = `user:${userId}:perms:debounced`;

        return this.debounce(
            key,
            async () => {
                const cached = await this.cache.get(`user:${userId}:perms`);
                if (cached) {
                    return JSON.parse(cached);
                }

                // Import here to avoid circular dependency
                const { PermissionRepository } = await import('../database/permission-repository');
                const repository = new PermissionRepository();
                return repository.getUserPermissions(userId);
            },
            debounceTime,
            cacheKey,
            300 // 5 minutes cache TTL
        );
    }

    public clear(key: string): void {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.delete(key);
        }
        this.pendingRequests.delete(key);
    }

    public clearAll(): void {
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        this.pendingRequests.clear();
    }
}
```

### Connection Pooling

```typescript
// src/database/connection-pool.ts
import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { DatabaseConfig } from '../config/database-config';
import { EventEmitter } from 'events';

export class ConnectionPool extends EventEmitter {
    private static instance: ConnectionPool;
    private pool: Pool;
    private logger: Logger;
    private config: DatabaseConfig;
    private activeConnections: Set<PoolClient>;
    private connectionMetrics: {
        totalConnections: number;
        activeConnections: number;
        waitingRequests: number;
        maxConnections: number;
        connectionWaitTime: number[];
    };

    private constructor() {
        super();
        this.logger = new Logger('ConnectionPool');
        this.config = new DatabaseConfig();
        this.activeConnections = new Set();
        this.connectionMetrics = {
            totalConnections: 0,
            activeConnections: 0,
            waitingRequests: 0,
            maxConnections: this.config.maxConnections,
            connectionWaitTime: []
        };

        const poolConfig: PoolConfig = {
            user: this.config.username,
            host: this.config.host,
            database: this.config.database,
            password: this.config.password,
            port: this.config.port,
            max: this.config.maxConnections,
            min: this.config.minConnections,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout,
            application_name: 'role-permissions-service',
            statement_timeout: this.config.statementTimeout,
            query_timeout: this.config.queryTimeout,
            ssl: this.config.sslEnabled ? {
                rejectUnauthorized: false,
                ca: this.config.sslCa
            } : false
        };

        this.pool = new Pool(poolConfig);

        // Setup event listeners
        this.setupEventListeners();

        // Start monitoring
        this.startMonitoring();
    }

    public static getInstance(): ConnectionPool {
        if (!ConnectionPool.instance) {
            ConnectionPool.instance = new ConnectionPool();
        }
        return ConnectionPool.instance;
    }

    private setupEventListeners(): void {
        this.pool.on('connect', (client) => {
            this.connectionMetrics.totalConnections++;
            this.logger.debug('New database connection established', {
                totalConnections: this.connectionMetrics.totalConnections
            });
        });

        this.pool.on('acquire', (client) => {
            this.activeConnections.add(client);
            this.connectionMetrics.activeConnections = this.activeConnections.size;
            this.logger.debug('Connection acquired from pool', {
                activeConnections: this.connectionMetrics.activeConnections
            });
        });

        this.pool.on('release', (err, client) => {
            this.activeConnections.delete(client);
            this.connectionMetrics.activeConnections = this.activeConnections.size;
            if (err) {
                this.logger.error('Error releasing connection', err);
            } else {
                this.logger.debug('Connection released back to pool', {
                    activeConnections: this.connectionMetrics.activeConnections
                });
            }
        });

        this.pool.on('error', (err, client) => {
            this.logger.error('Database connection error', err);
            this.emit('error', err);
        });

        this.pool.on('remove', (client) => {
            this.activeConnections.delete(client);
            this.connectionMetrics.totalConnections--;
            this.connectionMetrics.activeConnections = this.activeConnections.size;
            this.logger.debug('Connection removed from pool', {
                totalConnections: this.connectionMetrics.totalConnections,
                activeConnections: this.connectionMetrics.activeConnections
            });
        });
    }

    public async getClient(): Promise<PoolClient> {
        const startTime = Date.now();
        this.connectionMetrics.waitingRequests++;

        try {
            const client = await this.pool.connect();
            this.connectionMetrics.waitingRequests--;

            // Track connection wait time
            const waitTime = Date.now() - startTime;
            this.connectionMetrics.connectionWaitTime.push(waitTime);

            // Keep only the last 1000 measurements
            if (this.connectionMetrics.connectionWaitTime.length > 1000) {
                this.connectionMetrics.connectionWaitTime.shift();
            }

            // Log if wait time is too long
            if (waitTime > 1000) {
                this.logger.warn('Long connection wait time', {
                    waitTime,
                    activeConnections: this.connectionMetrics.activeConnections,
                    waitingRequests: this.connectionMetrics.waitingRequests
                });
            }

            return client;
        } catch (error) {
            this.connectionMetrics.waitingRequests--;
            this.logger.error('Failed to get database connection', error);
            throw error;
        }
    }

    public async query<T = any>(
        text: string,
        params?: any[],
        client?: PoolClient
    ): Promise<QueryResult<T>> {
        const useProvidedClient = !!client;
        const connection = client || await this.getClient();

        try {
            const startTime = Date.now();
            const result = await connection.query<T>(text, params);
            const duration = Date.now() - startTime;

            // Log slow queries
            if (duration > 1000) {
                this.logger.warn('Slow query detected', {
                    query: text,
                    duration,
                    params: params || []
                });
            }

            return result;
        } catch (error) {
            this.logger.error('Query failed', {
                query: text,
                params: params || [],
                error: error.message
            });
            throw error;
        } finally {
            if (!useProvidedClient) {
                connection.release();
            }
        }
    }

    public async transaction<T>(
        callback: (client: PoolClient) => Promise<T>
    ): Promise<T> {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Transaction failed', error);
            throw error;
        } finally {
            client.release();
        }
    }

    public async batchQuery<T = any>(
        queries: Array<{ text: string; params?: any[] }>
    ): Promise<QueryResult<T>[]> {
        const client = await this.getClient();
        try {
            const results: QueryResult<T>[] = [];
            for (const query of queries) {
                const result = await client.query<T>(query.text, query.params);
                results.push(result);
            }
            return results;
        } catch (error) {
            this.logger.error('Batch query failed', error);
            throw error;
        } finally {
            client.release();
        }
    }

    private startMonitoring(): void {
        // Log pool status every minute
        setInterval(() => {
            this.logger.info('Connection pool status', {
                totalConnections: this.connectionMetrics.totalConnections,
                activeConnections: this.connectionMetrics.activeConnections,
                waitingRequests: this.connectionMetrics.waitingRequests,
                maxConnections: this.connectionMetrics.maxConnections,
                avgWaitTime: this.calculateAverageWaitTime()
            });
        }, 60000);

        // Check for connection leaks
        setInterval(() => {
            if (this.activeConnections.size > this.config.maxConnections * 0.9) {
                this.logger.warn('High connection usage', {
                    activeConnections: this.activeConnections.size,
                    maxConnections: this.config.maxConnections
                });
            }
        }, 30000);
    }

    private calculateAverageWaitTime(): number {
        if (this.connectionMetrics.connectionWaitTime.length === 0) {
            return 0;
        }

        const sum = this.connectionMetrics.connectionWaitTime.reduce((a, b) => a + b, 0);
        return sum / this.connectionMetrics.connectionWaitTime.length;
    }

    public getMetrics(): any {
        return {
            ...this.connectionMetrics,
            avgWaitTime: this.calculateAverageWaitTime(),
            poolSize: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount
        };
    }

    public async end(): Promise<void> {
        try {
            await this.pool.end();
            this.logger.info('Database connection pool closed');
        } catch (error) {
            this.logger.error('Failed to close connection pool', error);
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
            this.logger.error('Database connection check failed', error);
            return false;
        }
    }
}
```

---

## Real-Time Features (300+ lines)

### WebSocket Server Setup

```typescript
// src/websocket/websocket-server.ts
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { WebSocketServer } from 'ws';
import { Logger } from '../utils/logger';
import { WebSocketConfig } from '../config/websocket-config';
import { WebSocketConnection } from './websocket-connection';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiter } from '../utils/rate-limiter';
import { PermissionCache } from '../cache/permission-cache';

export class WebSocketServerManager extends EventEmitter {
    private static instance: WebSocketServerManager;
    private wss: WebSocketServer;
    private logger: Logger;
    private config: WebSocketConfig;
    private connections: Map<string, WebSocketConnection>;
    private rateLimiter: RateLimiter;
    private cache: PermissionCache;
    private heartbeatInterval: NodeJS.Timeout;
    private connectionCleanupInterval: NodeJS.Timeout;

    private constructor(server: HttpServer | HttpsServer) {
        super();
        this.logger = new Logger('WebSocketServer');
        this.config = new WebSocketConfig();
        this.connections = new Map();
        this.rateLimiter = new RateLimiter(
            this.config.rateLimitMessages,
            this.config.rateLimitWindow
        );
        this.cache = PermissionCache.getInstance();

        // Create WebSocket server
        this.wss = new WebSocketServer({
            server,
            path: this.config.path,
            clientTracking: false,
            maxPayload: this.config.maxPayloadSize,
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
        this.startHeartbeat();
        this.startConnectionCleanup();
    }

    public static getInstance(server?: HttpServer | HttpsServer): WebSocketServerManager {
        if (!WebSocketServerManager.instance && server) {
            WebSocketServerManager.instance = new WebSocketServerManager(server);
        }
        return WebSocketServerManager.instance;
    }

    private setupEventListeners(): void {
        this.wss.on('connection', (ws, req) => {
            this.handleNewConnection(ws, req);
        });

        this.wss.on('error', (error) => {
            this.logger.error('WebSocket server error', error);
            this.emit('error', error);
        });

        this.wss.on('listening', () => {
            this.logger.info('WebSocket server listening', {
                path: this.config.path,
                port: this.config.port
            });
        });
    }

    private handleNewConnection(ws: WebSocket, req: any): void {
        const connectionId = uuidv4();
        const ip = this.getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'unknown';

        this.logger.info('New WebSocket connection', {
            connectionId,
            ip,
            userAgent
        });

        // Check rate limit
        if (this.rateLimiter.isRateLimited(ip)) {
            this.logger.warn('Connection rate limited', { ip });
            ws.close(1008, 'Too many connections');
            return;
        }

        // Create connection wrapper
        const connection = new WebSocketConnection(
            connectionId,
            ws,
            ip,
            userAgent,
            this.config
        );

        // Store connection
        this.connections.set(connectionId, connection);

        // Setup connection event listeners
        this.setupConnectionListeners(connection);

        // Send welcome message
        connection.send({
            type: 'welcome',
            connectionId,
            timestamp: new Date().toISOString(),
            serverVersion: this.config.serverVersion
        });

        // Increment rate limit counter
        this.rateLimiter.increment(ip);
    }

    private setupConnectionListeners(connection: WebSocketConnection): void {
        connection.on('message', (message) => {
            this.handleMessage(connection, message);
        });

        connection.on('close', (code, reason) => {
            this.handleClose(connection, code, reason);
        });

        connection.on('error', (error) => {
            this.handleError(connection, error);
        });

        connection.on('authenticated', (userId) => {
            this.handleAuthentication(connection, userId);
        });
    }

    private async handleMessage(connection: WebSocketConnection, message: any): Promise<void> {
        try {
            // Check rate limit
            if (this.rateLimiter.isRateLimited(connection.ip)) {
                connection.close(1008, 'Rate limit exceeded');
                return;
            }

            // Parse message
            const parsed = this.parseMessage(message);
            if (!parsed) {
                connection.sendError('invalid_message', 'Invalid message format');
                return;
            }

            // Handle different message types
            switch (parsed.type) {
                case 'auth':
                    await this.handleAuthMessage(connection, parsed);
                    break;
                case 'subscribe':
                    await this.handleSubscribeMessage(connection, parsed);
                    break;
                case 'unsubscribe':
                    await this.handleUnsubscribeMessage(connection, parsed);
                    break;
                case 'ping':
                    connection.send({ type: 'pong', timestamp: Date.now() });
                    break;
                default:
                    connection.sendError('invalid_type', 'Unknown message type');
            }

            // Increment rate limit counter
            this.rateLimiter.increment(connection.ip);
        } catch (error) {
            this.logger.error('Error handling WebSocket message', {
                connectionId: connection.id,
                error: error.message
            });
            connection.sendError('server_error', 'Internal server error');
        }
    }

    private parseMessage(message: any): any | null {
        try {
            if (typeof message === 'string') {
                return JSON.parse(message);
            } else if (message instanceof Buffer) {
                return JSON.parse(message.toString());
            } else if (typeof message === 'object') {
                return message;
            }
            return null;
        } catch (error) {
            this.logger.error('Failed to parse WebSocket message', error);
            return null;
        }
    }

    private async handleAuthMessage(connection: WebSocketConnection, message: any): Promise<void> {
        if (!message.token) {
            connection.sendError('auth_failed', 'Authentication token required');
            return;
        }

        try {
            // Verify JWT token (implementation would use your auth service)
            const userId = await this.verifyToken(message.token);

            if (!userId) {
                connection.sendError('auth_failed', 'Invalid authentication token');
                return;
            }

            // Authenticate connection
            connection.authenticate(userId);

            // Send success response
            connection.send({
                type: 'auth_success',
                userId,
                timestamp: new Date().toISOString()
            });

            // Join user's personal channel
            connection.joinChannel(`user:${userId}`);

            // Load initial permissions
            await this.loadInitialPermissions(connection, userId);
        } catch (error) {
            this.logger.error('Authentication failed', {
                connectionId: connection.id,
                error: error.message
            });
            connection.sendError('auth_failed', 'Authentication failed');
        }
    }

    private async verifyToken(token: string): Promise<string | null> {
        // In a real implementation, this would call your auth service
        // For now, we'll simulate token verification

        // Check cache first
        const cachedUserId = await this.cache.get(`ws:auth:${token}`);
        if (cachedUserId) {
            return cachedUserId;
        }

        // Simulate token verification
        if (token.startsWith('valid-')) {
            const userId = token.substring(6);
            await this.cache.setex(`ws:auth:${token}`, 3600, userId);
            return userId;
        }

        return null;
    }

    private async loadInitialPermissions(connection: WebSocketConnection, userId: string): Promise<void> {
        try {
            // Import here to avoid circular dependency
            const { PermissionRepository } = await import('../database/permission-repository');
            const repository = new PermissionRepository();

            const permissions = await repository.getUserPermissions(userId);

            connection.send({
                type: 'initial_permissions',
                permissions,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            this.logger.error('Failed to load initial permissions', {
                userId,
                error: error.message
            });
            connection.sendError('permissions_load_failed', 'Failed to load permissions');
        }
    }

    private async handleSubscribeMessage(connection: WebSocketConnection, message: any): Promise<void> {
        if (!connection.isAuthenticated) {
            connection.sendError('not_authenticated', 'Authentication required');
            return;
        }

        if (!message.channels || !Array.isArray(message.channels)) {
            connection.sendError('invalid_channels', 'Channels must be an array');
            return;
        }

        // Validate channels
        const validChannels = message.channels.filter((channel: string) => {
            return this.isValidChannel(channel, connection.userId);
        });

        if (validChannels.length === 0) {
            connection.sendError('invalid_channels', 'No valid channels provided');
            return;
        }

        // Subscribe to channels
        validChannels.forEach((channel: string) => {
            connection.joinChannel(channel);
        });

        connection.send({
            type: 'subscribe_success',
            channels: validChannels,
            timestamp: new Date().toISOString()
        });
    }

    private isValidChannel(channel: string, userId?: string): boolean {
        // Basic channel validation
        if (!channel || typeof channel !== 'string') {
            return false;
        }

        // Check for allowed patterns
        const allowedPatterns = [
            /^user:\w+$/, // User channels
            /^role:\w+$/, // Role channels
            /^resource:\w+$/, // Resource channels
            /^global$/, // Global channel
            /^system$/, // System channel
            /^app:\w+$/ // Application channels
        ];

        if (userId && channel === `user:${userId}`) {
            return true; // Always allow user's own channel
        }

        return allowedPatterns.some(pattern => pattern.test(channel));
    }

    private async handleUnsubscribeMessage(connection: WebSocketConnection, message: any): Promise<void> {
        if (!message.channels || !Array.isArray(message.channels)) {
            connection.sendError('invalid_channels', 'Channels must be an array');
            return;
        }

        // Unsubscribe from channels
        message.channels.forEach((channel: string) => {
            connection.leaveChannel(channel);
        });

        connection.send({
            type: 'unsubscribe_success',
            channels: message.channels,
            timestamp: new Date().toISOString()
        });
    }

    private handleClose(connection: WebSocketConnection, code: number, reason: string): void {
        this.logger.info('WebSocket connection closed', {
            connectionId: connection.id,
            code,
            reason,
            userId: connection.userId
        });

        this.connections.delete(connection.id);
        this.emit('connection_closed', connection.id, connection.userId);
    }

    private handleError(connection: WebSocketConnection, error: Error): void {
        this.logger.error('WebSocket connection error', {
            connectionId: connection.id,
            error: error.message,
            userId: connection.userId
        });
    }

    private handleAuthentication(connection: WebSocketConnection, userId: string): void {
        this.logger.info('WebSocket connection authenticated', {
            connectionId: connection.id,
            userId
        });
        this.emit('connection_authenticated', connection.id, userId);
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.connections.forEach(connection => {
                if (connection.isAlive) {
                    connection.isAlive = false;
                    connection.ping();
                } else {
                    connection.close(1001, 'Heartbeat failed');
                }
            });
        }, this.config.heartbeatInterval);
    }

    private startConnectionCleanup(): void {
        this.connectionCleanupInterval = setInterval(() => {
            const now = Date.now();
            this.connections.forEach((connection, id) => {
                if (now - connection.lastActivity > this.config.connectionTimeout) {
                    this.logger.info('Closing inactive WebSocket connection', {
                        connectionId: id,
                        lastActivity: new Date(connection.lastActivity).toISOString()
                    });
                    connection.close(1001, 'Connection timeout');
                }
            });
        }, this.config.connectionTimeoutCheckInterval);
    }

    public broadcast(channel: string, message: any): void {
        this.connections.forEach(connection => {
            if (connection.isSubscribedTo(channel)) {
                connection.send(message);
            }
        });
    }

    public sendToUser(userId: string, message: any): void {
        this.connections.forEach(connection => {
            if (connection.userId === userId) {
                connection.send(message);
            }
        });
    }

    public sendToConnection(connectionId: string, message: any): void {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.send(message);
        }
    }

    public getConnectionCount(): number {
        return this.connections.size;
    }

    public getAuthenticatedConnectionCount(): number {
        return Array.from(this.connections.values())
            .filter(conn => conn.isAuthenticated)
            .length;
    }

    public getConnections(): Map<string, WebSocketConnection> {
        return new Map(this.connections);
    }

    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down WebSocket server');

        // Clear intervals
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.connectionCleanupInterval) {
            clearInterval(this.connectionCleanupInterval);
        }

        // Close all connections
        this.connections.forEach(connection => {
            connection.close(1001, 'Server shutting down');
        });

        // Close WebSocket server
        return new Promise((resolve) => {
            this.wss.close(() => {
                this.logger.info('WebSocket server closed');
                resolve();
            });
        });
    }

    private getClientIp(req: any): string {
        // Handle different proxy scenarios
        const xForwardedFor = req.headers['x-forwarded-for'];
        if (xForwardedFor) {
            return xForwardedFor.split(',')[0].trim();
        }

        const realIp = req.headers['x-real-ip'];
        if (realIp) {
            return realIp;
        }

        return req.socket.remoteAddress || 'unknown';
    }
}
```

### WebSocket Connection Implementation

```typescript
// src/websocket/websocket-connection.ts
import { WebSocket } from 'ws';
import { Logger } from '../utils/logger';
import { WebSocketConfig } from '../config/websocket-config';
import { EventEmitter } from 'events';

export class WebSocketConnection extends EventEmitter {
    public readonly id: string;
    public readonly ip: string;
    public readonly userAgent: string;
    public readonly connectedAt: Date;
    public lastActivity: number;
    public isAlive: boolean;
    public userId?: string;
    public isAuthenticated: boolean = false;
    private ws: WebSocket;
    private logger: Logger;
    private config: WebSocketConfig;
    private channels: Set<string>;
    private messageQueue: any[];
    private isReady: boolean = false;

    constructor(
        id: string,
        ws: WebSocket,
        ip: string,
        userAgent: string,
        config: WebSocketConfig
    ) {
        super();
        this.id = id;
        this.ws = ws;
        this.ip = ip;
        this.userAgent = userAgent;
        this.config = config;
        this.connectedAt = new Date();
        this.lastActivity = Date.now();
        this.isAlive = true;
        this.channels = new Set();
        this.messageQueue = [];
        this.logger = new Logger(`WebSocketConnection:${id}`);

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.ws.on('message', (data) => {
            this.lastActivity = Date.now();
            this.isAlive = true;
            this.emit('message', data);
        });

        this.ws.on('close', (code, reason) => {
            this.emit('close', code, reason.toString());
        });

        this.ws.on('error', (error) => {
            this.emit('error', error);
        });

        this.ws.on('pong', () => {
            this.isAlive = true;
        });

        // Mark as ready when connection is established
        this.ws.on('open', () => {
            this.isReady = true;
            this.flushMessageQueue();
        });
    }

    public send(message: any): void {
        if (!this.isReady) {
            this.messageQueue.push(message);
            return;
        }

        try {
            const messageString = JSON.stringify(message);
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(messageString);
                this.lastActivity = Date.now();
            } else {
                this.logger.warn('Attempted to send message on closed connection');
            }
        } catch (error) {
            this.logger.error('Failed to send WebSocket message', error);
        }
    }

    public sendError(code: string, message: string): void {
        this.send({
            type: 'error',
            code,
            message,
            timestamp: new Date().toISOString()
        });
    }

    private flushMessageQueue(): void {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }

    public ping(): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.ping();
        }
    }

    public close(code?: number, reason?: string): void {
        this.ws.close(code, reason);
    }

    public authenticate(userId: string): void {
        this.userId = userId;
        this.isAuthenticated = true;
        this.emit('authenticated', userId);
    }

    public joinChannel(channel: string): void {
        if (!this.channels.has(channel)) {
            this.channels.add(channel);
            this.logger.debug('Joined channel', { channel, connectionId: this.id });
        }
    }

    public leaveChannel(channel: string): void {
        if (this.channels.has(channel)) {
            this.channels.delete(channel);
            this.logger.debug('Left channel', { channel, connectionId: this.id });
        }
    }

    public isSubscribedTo(channel: string): boolean {
        return this.channels.has(channel);
    }

    public getSubscribedChannels(): string[] {
        return Array.from(this.channels);
    }

    public getConnectionInfo(): any {
        return {
            id: this.id,
            ip: this.ip,
            userAgent: this.userAgent,
            connectedAt: this.connectedAt,
            lastActivity: new Date(this.lastActivity),
            isAlive: this.isAlive,
            userId: this.userId,
            isAuthenticated: this.isAuthenticated,
            channels: this.getSubscribedChannels()
        };
    }
}
```

### Real-Time Event Handlers

```typescript
// src/websocket/event-handlers.ts
import { WebSocketServerManager } from './websocket-server';
import { Logger } from '../utils/logger';
import { PermissionCache } from '../cache/permission-cache';
import { PermissionRepository } from '../database/permission-repository';
import { EventEmitter } from 'events';

export class RealTimeEventHandlers extends EventEmitter {
    private static instance: RealTimeEventHandlers;
    private wsServer: WebSocketServerManager;
    private logger: Logger;
    private cache: PermissionCache;
    private repository: PermissionRepository;
    private eventProcessors: Map<string, (data: any) => Promise<void>>;

    private constructor(wsServer: WebSocketServerManager) {
        super();
        this.wsServer = wsServer;
        this.logger = new Logger('RealTimeEventHandlers');
        this.cache = PermissionCache.getInstance();
        this.repository = new PermissionRepository();
        this.eventProcessors = new Map();

        this.setupEventProcessors();
        this.setupEventListeners();
    }

    public static getInstance(wsServer?: WebSocketServerManager): RealTimeEventHandlers {
        if (!RealTimeEventHandlers.instance && wsServer) {
            RealTimeEventHandlers.instance = new RealTimeEventHandlers(wsServer);
        }
        return RealTimeEventHandlers.instance;
    }

    private setupEventProcessors(): void {
        // Permission-related events
        this.eventProcessors.set('permission_granted', this.handlePermissionGranted.bind(this));
        this.eventProcessors.set('permission_revoked', this.handlePermissionRevoked.bind(this));
        this.eventProcessors.set('role_assigned', this.handleRoleAssigned.bind(this));
        this.eventProcessors.set('role_removed', this.handleRoleRemoved.bind(this));
        this.eventProcessors.set('permission_changed', this.handlePermissionChanged.bind(this));

        // User-related events
        this.eventProcessors.set('user_created', this.handleUserCreated.bind(this));
        this.eventProcessors.set('user_updated', this.handleUserUpdated.bind(this));
        this.eventProcessors.set('user_deleted', this.handleUserDeleted.bind(this));

        // System events
        this.eventProcessors.set('system_alert', this.handleSystemAlert.bind(this));
        this.eventProcessors.set('maintenance_mode', this.handleMaintenanceMode.bind(this));
    }

    private setupEventListeners(): void {
        // Listen for WebSocket server events
        this.wsServer.on('connection_authenticated', (connectionId, userId) => {
            this.handleConnectionAuthenticated(connectionId, userId);
        });

        this.wsServer.on('connection_closed', (connectionId, userId) => {
            this.handleConnectionClosed(connectionId, userId);
        });

        // Listen for internal events
        this.on('permission_event', this.processPermissionEvent.bind(this));
        this.on('user_event', this.processUserEvent.bind(this));
        this.on('system_event', this.processSystemEvent.bind(this));
    }

    public async handleEvent(eventType: string, data: any): Promise<void> {
        try {
            this.logger.debug('Handling real-time event', { eventType, data });

            if (this.eventProcessors.has(eventType)) {
                await this.eventProcessors.get(eventType)!(data);
            } else {
                this.logger.warn('No handler for event type', { eventType });
            }
        } catch (error) {
            this.logger.error('Error handling real-time event', {
                eventType,
                error: error.message
            });
        }
    }

    private async processPermissionEvent(data: any): Promise<void> {
        const { eventType, ...eventData } = data;

        switch (eventType) {
            case 'permission_granted':
            case 'permission_revoked':
                await this.handlePermissionGrantedOrRevoked(eventData);
                break;
            case 'role_assigned':
            case 'role_removed':
                await this.handleRoleAssignmentChange(eventData);
                break;
            case 'permission_changed':
                await this.handlePermissionDefinitionChange(eventData);
                break;
        }
    }

    private async processUserEvent(data: any): Promise<void> {
        const { eventType, userId } = data;

        switch (eventType) {
            case 'user_created':
            case 'user_updated':
                await this.notifyUser(userId, {
                    type: eventType,
                    userId,
                    timestamp: new Date().toISOString()
                });
                break;
            case 'user_deleted':
                await this.notifyUserChannels(userId, {
                    type: eventType,
                    userId,
                    timestamp: new Date().toISOString()
                });
                break;
        }
    }

    private async processSystemEvent(data: any): Promise<void> {
        const { eventType, ...eventData } = data;

        switch (eventType) {
            case 'system_alert':
                this.wsServer.broadcast('system', {
                    type: 'system_alert',
                    ...eventData,
                    timestamp: new Date().toISOString()
                });
                break;
            case 'maintenance_mode':
                this.wsServer.broadcast('system', {
                    type: 'maintenance_mode',
                    ...eventData,
                    timestamp: new Date().toISOString()
                });
                break;
        }
    }

    private async handlePermissionGranted(data: any): Promise<void> {
        const { userId, resource, action, grantedBy } = data;

        // Notify the user
        await this.notifyUser(userId, {
            type: 'permission_granted',
            resource,
            action,
            grantedBy,
            timestamp: new Date().toISOString()
        });

        // Notify any subscribers to the resource
        await this.notifyResourceSubscribers(resource, {
            type: 'permission_change',
            resource,
            action,
            userId,
            changeType: 'granted',
            timestamp: new Date().toISOString()
        });

        // Invalidate cache
        await this.cache.invalidateUserPermissions(userId);
    }

    private async handlePermissionRevoked(data: any): Promise<void> {
        const { userId, resource, action, revokedBy } = data;

        // Notify the user
        await this.notifyUser(userId, {
            type: 'permission_revoked',
            resource,
            action,
            revokedBy,
            timestamp: new Date().toISOString()
        });

        // Notify any subscribers to the resource
        await this.notifyResourceSubscribers(resource, {
            type: 'permission_change',
            resource,
            action,
            userId,
            changeType: 'revoked',
            timestamp: new Date().toISOString()
        });

        // Invalidate cache
        await this.cache.invalidateUserPermissions(userId);
    }

    private async handleRoleAssigned(data: any): Promise<void> {
        const { userId, roleId, assignedBy } = data;

        // Get role details
        const role = await this.repository.getCachedRoleDefinition(roleId);
        if (!role) {
            this.logger.warn('Role not found', { roleId });
            return;
        }

        // Notify the user
        await this.notifyUser(userId, {
            type: 'role_assigned',
            roleId,
            roleName: role.name,
            assignedBy,
            timestamp: new Date().toISOString()
        });

        // Notify any subscribers to the role
        await this.notifyRoleSubscribers(roleId, {
            type: 'role_change',
            roleId,
            roleName: role.name,
            userId,
            changeType: 'assigned',
            timestamp: new Date().toISOString()
        });

        // Invalidate cache
        await this.cache.invalidateUserPermissions(userId);
    }

    private async handleRoleRemoved(data: any): Promise<void> {
        const { userId, roleId, removedBy } = data;

        // Get role details
        const role = await this.repository.getCachedRoleDefinition(roleId);
        if (!role) {
            this.logger.warn('Role not found', { roleId });
            return;
        }

        // Notify the user
        await this.notifyUser(userId, {
            type: 'role_removed',
            roleId,
            roleName: role.name,
            removedBy,
            timestamp: new Date().toISOString()
        });

        // Notify any subscribers to the role
        await this.notifyRoleSubscribers(roleId, {
            type: 'role_change',
            roleId,
            roleName: role.name,
            userId,
            changeType: 'removed',
            timestamp: new Date().toISOString()
        });

        // Invalidate cache
        await this.cache.invalidateUserPermissions(userId);
    }

    private async handlePermissionChanged(data: any): Promise<void> {
        const { roleId, resource, action, changedBy } = data;

        // Get role details
        const role = await this.repository.getCachedRoleDefinition(roleId);
        if (!role) {
            this.logger.warn('Role not found', { roleId });
            return;
        }

        // Notify all users with this role
        const users = await this.getUsersWithRole(roleId);
        for (const userId of users) {
            await this.notifyUser(userId, {
                type: 'permission_changed',
                roleId,
                roleName: role.name,
                resource,
                action,
                changedBy,
                timestamp: new Date().toISOString()
            });
        }

        // Notify role subscribers
        await this.notifyRoleSubscribers(roleId, {
            type: 'permission_change',
            roleId,
            roleName: role.name,
            resource,
            action,
            changeType: 'updated',
            changedBy,
            timestamp: new Date().toISOString()
        });

        // Invalidate cache for all affected users
        for (const userId of users) {
            await this.cache.invalidateUserPermissions(userId);
        }
    }

    private async handleUserCreated(data: any): Promise<void> {
        const { userId, createdBy } = data;

        // Notify administrators
        await this.notifyAdminChannel({
            type: 'user_created',
            userId,
            createdBy,
            timestamp: new Date().toISOString()
        });
    }

    private async handleUserUpdated(data: any): Promise<void> {
        const { userId, updatedBy, changes } = data;

        // Notify the user
        await this.notifyUser(userId, {
            type: 'user_updated',
            userId,
            updatedBy,
            changes,
            timestamp: new Date().toISOString()
        });

        // Notify administrators if sensitive changes
        if (changes.includes('email') || changes.includes('status')) {
            await this.notifyAdminChannel({
                type: 'user_updated',
                userId,
                updatedBy,
                changes,
                timestamp: new Date().toISOString()
            });
        }
    }

    private async handleUserDeleted(data: any): Promise<void> {
        const { userId, deletedBy } = data;

        // Notify administrators
        await this.notifyAdminChannel({
            type: 'user_deleted',
            userId,
            deletedBy,
            timestamp: new Date().toISOString()
        });
    }

    private async handleSystemAlert(data: any): Promise<void> {
        const { message, severity, source } = data;

        // Broadcast to all connected clients
        this.wsServer.broadcast('system', {
            type: 'system_alert',
            message,
            severity,
            source,
            timestamp: new Date().toISOString()
        });
    }

    private async handleMaintenanceMode(data: any): Promise<void> {
        const { enabled, startTime, endTime, message } = data;

        // Broadcast to all connected clients
        this.wsServer.broadcast('system', {
            type: 'maintenance_mode',
            enabled,
            startTime,
            endTime,
            message,
            timestamp: new Date().toISOString()
        });
    }

    private async handleConnectionAuthenticated(connectionId: string, userId: string): Promise<void> {
        this.logger.info('User authenticated via WebSocket', { connectionId, userId });

        // Send any pending notifications
        await this.sendPendingNotifications(userId);

        // Join user to their personal channel
        this.wsServer.sendToConnection(connectionId, {
            type: 'channel_joined',
            channel: `user:${userId}`,
            timestamp: new Date().toISOString()
        });
    }

    private async handleConnectionClosed(connectionId: string, userId?: string): Promise<void> {
        this.logger.info('WebSocket connection closed', { connectionId, userId });

        if (userId) {
            // Clean up any pending notifications
            await this.cleanupPendingNotifications(userId);
        }
    }

    private async notifyUser(userId: string, message: any): Promise<void> {
        // Check if user is connected
        const isConnected = Array.from(this.wsServer.getConnections().values())
            .some(conn => conn.userId === userId);

        if (isConnected) {
            this.wsServer.sendToUser(userId, message);
        } else {
            // Store notification for later delivery
            await this.storePendingNotification(userId, message);
        }
    }

    private async notifyResourceSubscribers(resource: string, message: any): Promise<void> {
        const channel = `resource:${resource}`;
        this.wsServer.broadcast(channel, message);
    }

    private async notifyRoleSubscribers(roleId: string, message: any): Promise<void> {
        const channel = `role:${roleId}`;
        this.wsServer.broadcast(channel, message);
    }

    private async notifyAdminChannel(message: any): Promise<void> {
        this.wsServer.broadcast('admin', message);
    }

    private async notifyUserChannels(userId: string, message: any): Promise<void> {
        // Notify user's personal channel
        this.wsServer.broadcast(`user:${userId}`, message);

        // Notify any role channels the user might be in
        const roles = await this.getUserRoles(userId);
        for (const roleId of roles) {
            this.wsServer.broadcast(`role:${roleId}`, message);
        }
    }

    private async getUsersWithRole(roleId: string): Promise<string[]> {
        try {
            const client = await this.repository.getClient();
            const result = await client.query(
                `SELECT user_id FROM role_assignments
                 WHERE role_id = $1 AND is_active = true`,
                [roleId]
            );
            return result.rows.map(row => row.user_id);
        } catch (error) {
            this.logger.error('Failed to get users with role', {
                roleId,
                error: error.message
            });
            return [];
        }
    }

    private async getUserRoles(userId: string): Promise<string[]> {
        try {
            const client = await this.repository.getClient();
            const result = await client.query(
                `SELECT role_id FROM role_assignments
                 WHERE user_id = $1 AND is_active = true`,
                [userId]
            );
            return result.rows.map(row => row.role_id);
        } catch (error) {
            this.logger.error('Failed to get user roles', {
                userId,
                error: error.message
            });
            return [];
        }
    }

    private async storePendingNotification(userId: string, message: any): Promise<void> {
        try {
            const key = `ws:pending:${userId}`;
            const existing = await this.cache.get(key);
            const notifications = existing ? JSON.parse(existing) : [];
            notifications.push(message);
            await this.cache.setex(key, 86400, JSON.stringify(notifications)); // 24 hours
        } catch (error) {
            this.logger.error('Failed to store pending notification', {
                userId,
                error: error.message
            });
        }
    }

    private async sendPendingNotifications(userId: string): Promise<void> {
        try {
            const key = `ws