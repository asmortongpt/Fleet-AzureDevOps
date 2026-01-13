/**
 * GraphQL Schema for Damage Reports with Advanced Features
 * Implements: DataLoader batching, subscription support, federation, and performance optimization
 */

import { performance } from 'perf_hooks'

import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLScalarType,
  Kind
} from 'graphql'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { GraphQLDateTime, GraphQLJSONObject, GraphQLUUID } from 'graphql-scalars'
import { withFilter } from 'graphql-subscriptions'
import Redis from 'ioredis'


// Initialize PubSub for real-time subscriptions
const pubsub = new RedisPubSub({
  publisher: new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  }),
  subscriber: new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  }),
})

// Custom scalar for high-precision decimals
const GraphQLDecimal = new GraphQLScalarType({
  name: 'Decimal',
  description: 'High precision decimal value',
  serialize: (value: any) => parseFloat(value),
  parseValue: (value: any) => parseFloat(value),
  parseLiteral: (ast) => {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      return parseFloat(ast.value)
    }
    return null
  },
})

// Damage Status Enum
const DamageStatusEnum = new GraphQLEnumType({
  name: 'DamageStatus',
  values: {
    REPORTED: { value: 'reported' },
    ASSESSED: { value: 'assessed' },
    APPROVED: { value: 'approved' },
    IN_REPAIR: { value: 'in_repair' },
    COMPLETED: { value: 'completed' },
    REJECTED: { value: 'rejected' },
  },
})

// Damage Severity Enum
const DamageSeverityEnum = new GraphQLEnumType({
  name: 'DamageSeverity',
  values: {
    COSMETIC: { value: 'cosmetic' },
    MINOR: { value: 'minor' },
    MODERATE: { value: 'moderate' },
    MAJOR: { value: 'major' },
    CRITICAL: { value: 'critical' },
    TOTAL_LOSS: { value: 'total_loss' },
  },
})

// AI Analysis Type
const AIAnalysisType = new GraphQLObjectType({
  name: 'AIAnalysis',
  fields: {
    severityScore: { type: GraphQLFloat },
    confidenceScore: { type: GraphQLFloat },
    damageClassification: { type: GraphQLJSONObject },
    repairRecommendations: { type: new GraphQLList(GraphQLString) },
    estimatedRepairHours: { type: GraphQLFloat },
    predictedCost: { type: GraphQLDecimal },
    fraudRiskScore: { type: GraphQLFloat },
  },
})

// Geolocation Type
const GeoLocationType = new GraphQLObjectType({
  name: 'GeoLocation',
  fields: {
    latitude: { type: GraphQLFloat },
    longitude: { type: GraphQLFloat },
    address: { type: GraphQLString },
    geohash: { type: GraphQLString },
    nearbyIncidents: {
      type: new GraphQLList(GraphQLString),
      resolve: async (parent, args, context) => {
        // Use geospatial query to find nearby incidents
        return context.dataloaders.nearbyIncidents.load({
          lat: parent.latitude,
          lng: parent.longitude,
        })
      },
    },
  },
})

// Photo Type with AI analysis
const DamagePhotoType = new GraphQLObjectType({
  name: 'DamagePhoto',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLUUID) },
    photoUrl: { type: new GraphQLNonNull(GraphQLString) },
    thumbnailUrl: { type: GraphQLString },
    photoType: { type: GraphQLString },
    angle: { type: GraphQLString },
    damageArea: { type: GraphQLString },
    aiDamageDetected: { type: GraphQLBoolean },
    aiDamageRegions: { type: GraphQLJSONObject },
    aiQualityScore: { type: GraphQLFloat },
    capturedAt: { type: GraphQLDateTime },
    uploadedBy: { type: GraphQLString },
  },
})

// Repair Estimate Type
const RepairEstimateType = new GraphQLObjectType({
  name: 'RepairEstimate',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLUUID) },
    vendorName: { type: new GraphQLNonNull(GraphQLString) },
    estimateNumber: { type: GraphQLString },
    estimateDate: { type: GraphQLDateTime },
    laborCost: { type: GraphQLDecimal },
    partsCost: { type: GraphQLDecimal },
    totalCost: { type: new GraphQLNonNull(GraphQLDecimal) },
    estimatedHours: { type: GraphQLFloat },
    estimatedDays: { type: GraphQLInt },
    status: { type: GraphQLString },
    lineItems: { type: GraphQLJSONObject },
  },
})

// Main Damage Report Type
const DamageReportType = new GraphQLObjectType({
  name: 'DamageReport',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLUUID) },
    reportNumber: { type: new GraphQLNonNull(GraphQLString) },

    // Related entities with DataLoader batching
    vehicle: {
      type: VehicleType,
      resolve: (parent, args, context) =>
        context.dataloaders.vehicles.load(parent.vehicleId),
    },
    driver: {
      type: DriverType,
      resolve: (parent, args, context) =>
        parent.driverId ? context.dataloaders.drivers.load(parent.driverId) : null,
    },

    // Dates
    reportDate: { type: new GraphQLNonNull(GraphQLDateTime) },
    incidentDate: { type: new GraphQLNonNull(GraphQLDateTime) },

    // Status fields
    status: { type: new GraphQLNonNull(DamageStatusEnum) },
    severity: { type: new GraphQLNonNull(DamageSeverityEnum) },
    priority: { type: GraphQLInt },

    // Location
    location: { type: GeoLocationType },
    weatherConditions: { type: GraphQLString },

    // Damage details
    damageDescription: { type: new GraphQLNonNull(GraphQLString) },
    damageAreas: { type: GraphQLJSONObject },

    // Financial
    estimatedCost: { type: GraphQLDecimal },
    actualCost: { type: GraphQLDecimal },
    insuranceClaimNumber: { type: GraphQLString },

    // Media
    photos: {
      type: new GraphQLList(DamagePhotoType),
      resolve: (parent, args, context) =>
        context.dataloaders.damagePhotos.load(parent.id),
    },
    model3dUrl: { type: GraphQLString },
    model3dStatus: { type: GraphQLString },

    // AI Analysis
    aiAnalysis: { type: AIAnalysisType },

    // Repair Estimates
    repairEstimates: {
      type: new GraphQLList(RepairEstimateType),
      resolve: (parent, args, context) =>
        context.dataloaders.repairEstimates.load(parent.id),
    },

    // Metadata
    createdAt: { type: GraphQLDateTime },
    updatedAt: { type: GraphQLDateTime },

    // Computed fields
    repairDuration: {
      type: GraphQLInt,
      description: 'Repair duration in hours',
      resolve: (parent) => {
        if (parent.status === 'completed' && parent.updatedAt && parent.createdAt) {
          return Math.floor((parent.updatedAt - parent.createdAt) / 3600000)
        }
        return null
      },
    },

    // Real-time updates count
    updateCount: {
      type: GraphQLInt,
      resolve: async (parent, args, context) => {
        const count = await context.redis.get(`updates:${parent.id}`)
        return parseInt(count || '0')
      },
    },
  }),
})

// Vehicle Type (simplified for reference)
const VehicleType = new GraphQLObjectType({
  name: 'Vehicle',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    vehicleNumber: { type: GraphQLString },
    make: { type: GraphQLString },
    model: { type: GraphQLString },
    year: { type: GraphQLInt },
    currentValue: { type: GraphQLDecimal },
  },
})

// Driver Type (simplified for reference)
const DriverType = new GraphQLObjectType({
  name: 'Driver',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    licenseNumber: { type: GraphQLString },
  },
})

// Pagination Info Type
const PageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  fields: {
    hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
    hasPreviousPage: { type: new GraphQLNonNull(GraphQLBoolean) },
    startCursor: { type: GraphQLString },
    endCursor: { type: GraphQLString },
    totalCount: { type: GraphQLInt },
  },
})

// Edge Type for cursor pagination
const DamageReportEdge = new GraphQLObjectType({
  name: 'DamageReportEdge',
  fields: {
    cursor: { type: new GraphQLNonNull(GraphQLString) },
    node: { type: DamageReportType },
  },
})

// Connection Type for cursor pagination
const DamageReportConnection = new GraphQLObjectType({
  name: 'DamageReportConnection',
  fields: {
    edges: { type: new GraphQLList(DamageReportEdge) },
    pageInfo: { type: PageInfoType },
    totalCount: { type: GraphQLInt },
  },
})

// Filter Input Type
const DamageReportFilterInput = new GraphQLInputObjectType({
  name: 'DamageReportFilter',
  fields: {
    status: { type: DamageStatusEnum },
    severity: { type: DamageSeverityEnum },
    vehicleId: { type: GraphQLInt },
    driverId: { type: GraphQLInt },
    dateFrom: { type: GraphQLDateTime },
    dateTo: { type: GraphQLDateTime },
    minCost: { type: GraphQLDecimal },
    maxCost: { type: GraphQLDecimal },
    searchText: { type: GraphQLString },
    nearLocation: {
      type: new GraphQLInputObjectType({
        name: 'NearLocationInput',
        fields: {
          latitude: { type: new GraphQLNonNull(GraphQLFloat) },
          longitude: { type: new GraphQLNonNull(GraphQLFloat) },
          radiusKm: { type: GraphQLFloat, defaultValue: 10 },
        },
      }),
    },
  },
})

// Sort Input Type
const DamageReportSortInput = new GraphQLInputObjectType({
  name: 'DamageReportSort',
  fields: {
    field: {
      type: new GraphQLEnumType({
        name: 'DamageReportSortField',
        values: {
          REPORT_DATE: { value: 'reportDate' },
          INCIDENT_DATE: { value: 'incidentDate' },
          SEVERITY: { value: 'severity' },
          COST: { value: 'estimatedCost' },
          PRIORITY: { value: 'priority' },
        },
      }),
    },
    direction: {
      type: new GraphQLEnumType({
        name: 'SortDirection',
        values: {
          ASC: { value: 'ASC' },
          DESC: { value: 'DESC' },
        },
      }),
    },
  },
})

// Aggregation Type
const DamageReportAggregationType = new GraphQLObjectType({
  name: 'DamageReportAggregation',
  fields: {
    totalReports: { type: GraphQLInt },
    totalCost: { type: GraphQLDecimal },
    averageCost: { type: GraphQLDecimal },
    averageRepairTime: { type: GraphQLFloat },
    severityDistribution: { type: GraphQLJSONObject },
    statusDistribution: { type: GraphQLJSONObject },
    topDamageTypes: { type: new GraphQLList(GraphQLString) },
    costByMonth: { type: GraphQLJSONObject },
  },
})

// Create Report Input
const CreateDamageReportInput = new GraphQLInputObjectType({
  name: 'CreateDamageReportInput',
  fields: {
    vehicleId: { type: new GraphQLNonNull(GraphQLInt) },
    driverId: { type: GraphQLInt },
    incidentDate: { type: new GraphQLNonNull(GraphQLDateTime) },
    severity: { type: new GraphQLNonNull(DamageSeverityEnum) },
    damageDescription: { type: new GraphQLNonNull(GraphQLString) },
    latitude: { type: GraphQLFloat },
    longitude: { type: GraphQLFloat },
    locationAddress: { type: GraphQLString },
    photos: { type: new GraphQLList(GraphQLString) },
    estimatedCost: { type: GraphQLDecimal },
  },
})

// Update Report Input
const UpdateDamageReportInput = new GraphQLInputObjectType({
  name: 'UpdateDamageReportInput',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLUUID) },
    status: { type: DamageStatusEnum },
    severity: { type: DamageSeverityEnum },
    actualCost: { type: GraphQLDecimal },
    assessmentNotes: { type: GraphQLString },
    insuranceClaimNumber: { type: GraphQLString },
  },
})

// Root Query Type
const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    // Single damage report
    damageReport: {
      type: DamageReportType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLUUID) },
      },
      resolve: async (parent, args, context) => {
        const startTime = performance.now()
        const report = await context.dataloaders.damageReports.load(args.id)

        // Track query performance
        context.metrics.recordQuery('damageReport', performance.now() - startTime)

        return report
      },
    },

    // Paginated damage reports with filtering
    damageReports: {
      type: DamageReportConnection,
      args: {
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        last: { type: GraphQLInt },
        before: { type: GraphQLString },
        filter: { type: DamageReportFilterInput },
        sort: { type: DamageReportSortInput },
      },
      resolve: async (parent, args, context) => {
        const startTime = performance.now()

        // Implement cursor-based pagination with filtering
        const result = await context.services.damageReportService.paginate({
          first: args.first,
          after: args.after,
          last: args.last,
          before: args.before,
          filter: args.filter,
          sort: args.sort,
        })

        context.metrics.recordQuery('damageReports', performance.now() - startTime)

        return result
      },
    },

    // Aggregated statistics
    damageReportStats: {
      type: DamageReportAggregationType,
      args: {
        filter: { type: DamageReportFilterInput },
        groupBy: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        const cacheKey = `stats:${JSON.stringify(args)}`

        // Try cache first
        const cached = await context.redis.get(cacheKey)
        if (cached) {
          return JSON.parse(cached)
        }

        const stats = await context.services.damageReportService.getAggregatedStats(
          args.filter,
          args.groupBy
        )

        // Cache for 5 minutes
        await context.redis.setex(cacheKey, 300, JSON.stringify(stats))

        return stats
      },
    },

    // Search with full-text capabilities
    searchDamageReports: {
      type: new GraphQLList(DamageReportType),
      args: {
        query: { type: new GraphQLNonNull(GraphQLString) },
        limit: { type: GraphQLInt, defaultValue: 10 },
      },
      resolve: async (parent, args, context) => {
        return context.services.damageReportService.fullTextSearch(
          args.query,
          args.limit
        )
      },
    },

    // Geospatial clustering
    damageReportClusters: {
      type: new GraphQLList(new GraphQLObjectType({
        name: 'DamageReportCluster',
        fields: {
          centroid: { type: GeoLocationType },
          count: { type: GraphQLInt },
          radius: { type: GraphQLFloat },
          severity: { type: DamageSeverityEnum },
          reports: { type: new GraphQLList(DamageReportType) },
        },
      })),
      args: {
        bounds: {
          type: new GraphQLInputObjectType({
            name: 'GeoBoundsInput',
            fields: {
              north: { type: new GraphQLNonNull(GraphQLFloat) },
              south: { type: new GraphQLNonNull(GraphQLFloat) },
              east: { type: new GraphQLNonNull(GraphQLFloat) },
              west: { type: new GraphQLNonNull(GraphQLFloat) },
            },
          }),
        },
        zoomLevel: { type: GraphQLInt },
      },
      resolve: async (parent, args, context) => {
        return context.services.geospatialService.clusterDamageReports(
          args.bounds,
          args.zoomLevel
        )
      },
    },
  },
})

// Root Mutation Type
const RootMutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    // Create damage report
    createDamageReport: {
      type: DamageReportType,
      args: {
        input: { type: new GraphQLNonNull(CreateDamageReportInput) },
      },
      resolve: async (parent, args, context) => {
        const report = await context.services.damageReportService.create(args.input)

        // Publish for subscriptions
        await pubsub.publish('DAMAGE_REPORT_CREATED', {
          damageReportCreated: report,
        })

        // Trigger AI analysis async
        context.queues.aiAnalysis.add('analyze', { reportId: report.id })

        return report
      },
    },

    // Update damage report
    updateDamageReport: {
      type: DamageReportType,
      args: {
        input: { type: new GraphQLNonNull(UpdateDamageReportInput) },
      },
      resolve: async (parent, args, context) => {
        const report = await context.services.damageReportService.update(
          args.input.id,
          args.input
        )

        // Publish for subscriptions
        await pubsub.publish('DAMAGE_REPORT_UPDATED', {
          damageReportUpdated: report,
        })

        // Invalidate cache
        await context.redis.del(`report:${args.input.id}`)

        return report
      },
    },

    // Process 3D model
    process3DModel: {
      type: new GraphQLObjectType({
        name: 'Process3DModelResult',
        fields: {
          jobId: { type: GraphQLString },
          estimatedTime: { type: GraphQLInt },
          status: { type: GraphQLString },
        },
      }),
      args: {
        reportId: { type: new GraphQLNonNull(GraphQLUUID) },
        photos: { type: new GraphQLList(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        const job = await context.queues.model3D.add('generate', {
          reportId: args.reportId,
          photos: args.photos,
        })

        return {
          jobId: job.id,
          estimatedTime: 300, // 5 minutes estimate
          status: 'queued',
        }
      },
    },

    // Batch operations
    batchUpdateDamageReports: {
      type: new GraphQLList(DamageReportType),
      args: {
        ids: { type: new GraphQLList(GraphQLUUID) },
        update: { type: UpdateDamageReportInput },
      },
      resolve: async (parent, args, context) => {
        const results = await Promise.all(
          args.ids.map(id =>
            context.services.damageReportService.update(id, args.update)
          )
        )

        // Bulk cache invalidation
        const keys = args.ids.map(id => `report:${id}`)
        await context.redis.del(...keys)

        return results
      },
    },
  },
})

// Root Subscription Type
const RootSubscriptionType = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    // Real-time damage report creation
    damageReportCreated: {
      type: DamageReportType,
      args: {
        vehicleId: { type: GraphQLInt },
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator(['DAMAGE_REPORT_CREATED']),
        (payload, args) => {
          if (!args.vehicleId) return true
          return payload.damageReportCreated.vehicleId === args.vehicleId
        }
      ),
    },

    // Real-time damage report updates
    damageReportUpdated: {
      type: DamageReportType,
      args: {
        reportId: { type: GraphQLUUID },
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator(['DAMAGE_REPORT_UPDATED']),
        (payload, args) => {
          if (!args.reportId) return true
          return payload.damageReportUpdated.id === args.reportId
        }
      ),
    },

    // 3D model processing status
    model3DProcessingStatus: {
      type: new GraphQLObjectType({
        name: 'Model3DStatus',
        fields: {
          reportId: { type: GraphQLUUID },
          status: { type: GraphQLString },
          progress: { type: GraphQLInt },
          modelUrl: { type: GraphQLString },
          error: { type: GraphQLString },
        },
      }),
      args: {
        reportId: { type: new GraphQLNonNull(GraphQLUUID) },
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator(['MODEL_3D_STATUS']),
        (payload, args) => payload.model3DStatus.reportId === args.reportId
      ),
    },

    // AI analysis completion
    aiAnalysisComplete: {
      type: AIAnalysisType,
      args: {
        reportId: { type: new GraphQLNonNull(GraphQLUUID) },
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator(['AI_ANALYSIS_COMPLETE']),
        (payload, args) => payload.reportId === args.reportId
      ),
    },
  },
})

// Create and export the schema
export const damageReportSchema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType,
  subscription: RootSubscriptionType,
})

// Export pubsub for use in resolvers
export { pubsub }