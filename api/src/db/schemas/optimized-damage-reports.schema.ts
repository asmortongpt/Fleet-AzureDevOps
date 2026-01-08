/**
 * Enterprise-Grade Optimized Database Schema for Damage Reports
 * Implements: Partitioning, Advanced Indexes, Materialized Views, and Performance Optimizations
 */

import { sql } from 'drizzle-orm'
import {
  pgTable,
  varchar,
  timestamp,
  integer,
  boolean,
  decimal,
  text,
  jsonb,
  uuid,
  index,
  pgEnum,
  doublePrecision,
  smallint,
  check,
  foreignKey
} from 'drizzle-orm/pg-core'

// Enums for type safety and performance
export const damageStatusEnum = pgEnum('damage_status', [
  'reported',
  'assessed',
  'approved',
  'in_repair',
  'completed',
  'rejected'
])

export const damageSeverityEnum = pgEnum('damage_severity', [
  'cosmetic',
  'minor',
  'moderate',
  'major',
  'critical',
  'total_loss'
])

export const damageTypeEnum = pgEnum('damage_type', [
  'collision',
  'vandalism',
  'weather',
  'wear_tear',
  'mechanical',
  'glass',
  'tire',
  'interior',
  'theft',
  'fire',
  'flood',
  'other'
])

// Main damage reports table with partitioning by date
export const damageReports = pgTable('damage_reports_partitioned', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportNumber: varchar('report_number', { length: 50 }).notNull().unique(),

  // Foreign Keys with indexing
  vehicleId: integer('vehicle_id').notNull(),
  driverId: integer('driver_id'),
  facilityId: integer('facility_id'),

  // Temporal data for partitioning
  reportDate: timestamp('report_date', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  incidentDate: timestamp('incident_date', { mode: 'date', withTimezone: true }).notNull(),

  // Status and classification
  status: damageStatusEnum('status').notNull().default('reported'),
  severity: damageSeverityEnum('severity').notNull(),
  damageType: damageTypeEnum('damage_type').notNull(),
  priority: smallint('priority').notNull().default(5),

  // Location data with PostGIS support
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  geohash: varchar('geohash', { length: 12 }), // For efficient geospatial indexing
  locationAddress: text('location_address'),
  weatherConditions: varchar('weather_conditions', { length: 100 }),

  // Damage assessment
  damageDescription: text('damage_description').notNull(),
  damageAreas: jsonb('damage_areas').notNull().default('[]'), // Structured damage zones

  // Financial data
  estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 12, scale: 2 }),
  insuranceClaimNumber: varchar('insurance_claim_number', { length: 100 }),
  deductibleAmount: decimal('deductible_amount', { precision: 10, scale: 2 }),

  // 3D Model and Media
  photos: jsonb('photos').notNull().default('[]'),
  model3dUrl: varchar('model_3d_url', { length: 500 }),
  model3dStatus: varchar('model_3d_status', { length: 20 }).default('pending'),
  model3dProcessedAt: timestamp('model_3d_processed_at'),
  model3dMetadata: jsonb('model_3d_metadata'),

  // AI/ML Analysis Results
  aiSeverityScore: decimal('ai_severity_score', { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  aiConfidenceScore: decimal('ai_confidence_score', { precision: 5, scale: 4 }),
  aiDamageClassification: jsonb('ai_damage_classification'),
  aiRepairRecommendations: jsonb('ai_repair_recommendations'),
  aiEstimatedRepairHours: decimal('ai_estimated_repair_hours', { precision: 6, scale: 2 }),

  // Audit and compliance
  reportedBy: varchar('reported_by', { length: 255 }).notNull(),
  assessedBy: varchar('assessed_by', { length: 255 }),
  approvedBy: varchar('approved_by', { length: 255 }),
  assessmentNotes: text('assessment_notes'),

  // Performance optimization fields
  searchVector: text('search_vector'), // Full-text search vector
  cacheTtl: integer('cache_ttl').default(3600), // Cache time-to-live in seconds
  isArchived: boolean('is_archived').default(false),

  // Timestamps with automatic updates
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (table) => ({
  // BRIN indexes for time-series data (efficient for large datasets)
  brinReportDate: index('idx_damage_reports_brin_report_date').using('brin', table.reportDate),
  brinIncidentDate: index('idx_damage_reports_brin_incident_date').using('brin', table.incidentDate),

  // B-tree indexes for high-cardinality columns
  btreeVehicleId: index('idx_damage_reports_vehicle_id').on(table.vehicleId),
  btreeDriverId: index('idx_damage_reports_driver_id').on(table.driverId),
  btreeStatus: index('idx_damage_reports_status').on(table.status),
  btreeSeverity: index('idx_damage_reports_severity').on(table.severity),

  // Geospatial index
  gistLocation: index('idx_damage_reports_location').using('gist',
    sql`ST_MakePoint(${table.longitude}, ${table.latitude})`
  ),

  // GeoHash index for proximity searches
  hashGeohash: index('idx_damage_reports_geohash').using('hash', table.geohash),

  // Covering indexes for common queries
  coveringStatusDate: index('idx_damage_reports_covering_status_date')
    .on(table.status, table.reportDate, table.vehicleId, table.estimatedCost),

  coveringVehicleHistory: index('idx_damage_reports_covering_vehicle_history')
    .on(table.vehicleId, table.reportDate, table.status, table.severity, table.actualCost),

  // GIN index for JSONB columns
  ginDamageAreas: index('idx_damage_reports_gin_damage_areas').using('gin', table.damageAreas),
  ginAiClassification: index('idx_damage_reports_gin_ai_classification').using('gin', table.aiDamageClassification),

  // Full-text search index
  gistSearchVector: index('idx_damage_reports_search').using('gist',
    sql`to_tsvector('english', ${table.searchVector})`
  ),

  // Partial indexes for specific conditions
  partialActiveReports: index('idx_damage_reports_partial_active')
    .on(table.reportDate, table.status)
    .where(sql`${table.status} NOT IN ('completed', 'rejected') AND ${table.isArchived} = false`),

  partialHighPriority: index('idx_damage_reports_partial_high_priority')
    .on(table.priority, table.reportDate)
    .where(sql`${table.priority} <= 3 AND ${table.status} = 'reported'`),

  // Constraints
  checkEstimatedCost: check('check_estimated_cost_positive', sql`${table.estimatedCost} >= 0`),
  checkActualCost: check('check_actual_cost_positive', sql`${table.actualCost} >= 0`),
  checkAiScores: check('check_ai_scores_valid',
    sql`${table.aiSeverityScore} >= 0 AND ${table.aiSeverityScore} <= 1 AND
        ${table.aiConfidenceScore} >= 0 AND ${table.aiConfidenceScore} <= 1`
  ),
  checkPriority: check('check_priority_range', sql`${table.priority} >= 1 AND ${table.priority} <= 10`),
}))

// Damage Photos table (normalized for better performance)
export const damagePhotos = pgTable('damage_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id').notNull(),

  // Photo metadata
  photoUrl: varchar('photo_url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  photoHash: varchar('photo_hash', { length: 64 }), // SHA-256 for deduplication

  // Classification
  photoType: varchar('photo_type', { length: 50 }), // 'overview', 'close-up', 'damage-detail', etc.
  angle: varchar('angle', { length: 50 }), // 'front', 'rear', 'left', 'right', etc.
  damageArea: varchar('damage_area', { length: 100 }),

  // Technical metadata
  fileSize: integer('file_size'), // in bytes
  width: smallint('width'),
  height: smallint('height'),
  mimeType: varchar('mime_type', { length: 50 }),

  // AI Analysis
  aiDamageDetected: boolean('ai_damage_detected'),
  aiDamageRegions: jsonb('ai_damage_regions'),
  aiObjectDetection: jsonb('ai_object_detection'),
  aiQualityScore: decimal('ai_quality_score', { precision: 5, scale: 4 }),

  // EXIF data
  capturedAt: timestamp('captured_at', { withTimezone: true }),
  deviceInfo: jsonb('device_info'),
  gpsCoordinates: jsonb('gps_coordinates'),

  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Foreign key index
  idxReportId: index('idx_damage_photos_report_id').on(table.reportId),

  // Deduplication index
  idxPhotoHash: index('idx_damage_photos_hash').on(table.photoHash),

  // Composite index for photo queries
  idxReportType: index('idx_damage_photos_report_type').on(table.reportId, table.photoType),

  // Foreign key constraint
  fkReport: foreignKey({
    columns: [table.reportId],
    foreignColumns: [damageReports.id],
    name: 'fk_damage_photos_report'
  }).onDelete('cascade'),
}))

// Repair Estimates table
export const repairEstimates = pgTable('repair_estimates', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id').notNull(),

  // Vendor information
  vendorId: integer('vendor_id').notNull(),
  vendorName: varchar('vendor_name', { length: 255 }).notNull(),

  // Estimate details
  estimateNumber: varchar('estimate_number', { length: 50 }).unique(),
  estimateDate: timestamp('estimate_date', { withTimezone: true }).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }),

  // Cost breakdown
  laborCost: decimal('labor_cost', { precision: 10, scale: 2 }).notNull(),
  partsCost: decimal('parts_cost', { precision: 10, scale: 2 }).notNull(),
  otherCost: decimal('other_cost', { precision: 10, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }).notNull(),

  // Time estimates
  estimatedHours: decimal('estimated_hours', { precision: 6, scale: 2 }),
  estimatedDays: smallint('estimated_days'),

  // Details
  lineItems: jsonb('line_items').notNull().default('[]'),
  notes: text('notes'),
  documentUrl: varchar('document_url', { length: 500 }),

  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, rejected
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  acceptedBy: varchar('accepted_by', { length: 255 }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxReportId: index('idx_repair_estimates_report_id').on(table.reportId),
  idxVendorId: index('idx_repair_estimates_vendor_id').on(table.vendorId),
  idxStatus: index('idx_repair_estimates_status').on(table.status),

  fkReport: foreignKey({
    columns: [table.reportId],
    foreignColumns: [damageReports.id],
    name: 'fk_repair_estimates_report'
  }).onDelete('cascade'),
}))

// Create function for automatic search vector update
export const updateSearchVectorFunction = sql`
CREATE OR REPLACE FUNCTION update_damage_report_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.report_number, '') || ' ' ||
    COALESCE(NEW.damage_description, '') || ' ' ||
    COALESCE(NEW.location_address, '') || ' ' ||
    COALESCE(NEW.assessment_notes, '') || ' ' ||
    COALESCE(NEW.damage_type::text, '') || ' ' ||
    COALESCE(NEW.severity::text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`

// Create trigger for search vector
export const searchVectorTrigger = sql`
CREATE TRIGGER trigger_update_search_vector
BEFORE INSERT OR UPDATE ON damage_reports_partitioned
FOR EACH ROW EXECUTE FUNCTION update_damage_report_search_vector();
`

// Create table partitioning by month
export const createPartitioning = sql`
-- Convert to partitioned table by range (report_date)
ALTER TABLE damage_reports_partitioned
PARTITION BY RANGE (report_date);

-- Create partitions for the next 12 months
DO $$
DECLARE
  start_date date := date_trunc('month', CURRENT_DATE);
  end_date date;
  partition_name text;
BEGIN
  FOR i IN 0..11 LOOP
    end_date := start_date + interval '1 month';
    partition_name := 'damage_reports_' || to_char(start_date, 'YYYY_MM');

    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF damage_reports_partitioned
      FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );

    start_date := end_date;
  END LOOP;
END$$;

-- Create function for automatic partition management
CREATE OR REPLACE FUNCTION create_monthly_partition() RETURNS void AS $$
DECLARE
  start_date date;
  end_date date;
  partition_name text;
BEGIN
  start_date := date_trunc('month', CURRENT_DATE + interval '1 month');
  end_date := start_date + interval '1 month';
  partition_name := 'damage_reports_' || to_char(start_date, 'YYYY_MM');

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I PARTITION OF damage_reports_partitioned
    FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule partition creation (requires pg_cron extension)
-- SELECT cron.schedule('create-monthly-partition', '0 0 1 * *', 'SELECT create_monthly_partition();');
`

// Materialized View for damage statistics by vehicle
export const mvDamageStatsByVehicle = sql`
CREATE MATERIALIZED VIEW mv_damage_stats_by_vehicle AS
WITH damage_summary AS (
  SELECT
    vehicle_id,
    COUNT(*) as total_reports,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_reports,
    COUNT(*) FILTER (WHERE status IN ('reported', 'assessed', 'approved', 'in_repair')) as active_reports,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::numeric(10,2) as avg_resolution_hours,
    SUM(actual_cost) as total_repair_cost,
    AVG(actual_cost) as avg_repair_cost,
    MIN(report_date) as first_report_date,
    MAX(report_date) as last_report_date,
    COUNT(DISTINCT damage_type) as unique_damage_types,
    AVG(ai_severity_score) as avg_severity_score,
    jsonb_agg(DISTINCT damage_type) as damage_types,
    jsonb_object_agg(severity::text, count(*)) as severity_distribution
  FROM damage_reports_partitioned
  WHERE is_archived = false
  GROUP BY vehicle_id
)
SELECT
  ds.*,
  v.vehicle_number,
  v.make,
  v.model,
  v.year,
  v.current_value,
  CASE
    WHEN ds.total_repair_cost > v.current_value * 0.75 THEN 'high_risk'
    WHEN ds.total_repair_cost > v.current_value * 0.5 THEN 'medium_risk'
    ELSE 'low_risk'
  END as risk_category,
  (ds.total_reports::numeric / GREATEST(1, EXTRACT(YEAR FROM AGE(NOW(), ds.first_report_date))))::numeric(10,2) as reports_per_year
FROM damage_summary ds
JOIN vehicles v ON ds.vehicle_id = v.id;

CREATE UNIQUE INDEX idx_mv_damage_stats_vehicle_id ON mv_damage_stats_by_vehicle (vehicle_id);
CREATE INDEX idx_mv_damage_stats_risk ON mv_damage_stats_by_vehicle (risk_category);
CREATE INDEX idx_mv_damage_stats_cost ON mv_damage_stats_by_vehicle (total_repair_cost DESC);
`

// Materialized View for geospatial damage hotspots
export const mvDamageHotspots = sql`
CREATE MATERIALIZED VIEW mv_damage_hotspots AS
WITH geohash_groups AS (
  SELECT
    LEFT(geohash, 5) as geohash_prefix, -- Approximately 5km x 5km area
    COUNT(*) as incident_count,
    AVG(latitude) as center_lat,
    AVG(longitude) as center_lng,
    AVG(actual_cost) as avg_cost,
    jsonb_object_agg(damage_type::text, count(*)) as damage_type_distribution,
    jsonb_object_agg(severity::text, count(*)) as severity_distribution,
    array_agg(DISTINCT vehicle_id) as affected_vehicles
  FROM damage_reports_partitioned
  WHERE
    latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND report_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY LEFT(geohash, 5)
  HAVING COUNT(*) >= 3 -- Minimum incidents to be considered a hotspot
)
SELECT
  *,
  ST_MakePoint(center_lng, center_lat) as center_point,
  CASE
    WHEN incident_count >= 20 THEN 'critical'
    WHEN incident_count >= 10 THEN 'high'
    WHEN incident_count >= 5 THEN 'medium'
    ELSE 'low'
  END as hotspot_level
FROM geohash_groups;

CREATE INDEX idx_mv_hotspots_geohash ON mv_damage_hotspots (geohash_prefix);
CREATE INDEX idx_mv_hotspots_spatial ON mv_damage_hotspots USING gist(center_point);
CREATE INDEX idx_mv_hotspots_level ON mv_damage_hotspots (hotspot_level);
`

// Create refresh function for materialized views
export const refreshMaterializedViews = sql`
CREATE OR REPLACE FUNCTION refresh_damage_materialized_views() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_damage_stats_by_vehicle;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_damage_hotspots;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour (requires pg_cron)
-- SELECT cron.schedule('refresh-damage-views', '0 * * * *', 'SELECT refresh_damage_materialized_views();');
`

// Export type definitions for TypeScript
export type DamageReport = typeof damageReports.$inferSelect
export type NewDamageReport = typeof damageReports.$inferInsert
export type DamagePhoto = typeof damagePhotos.$inferSelect
export type NewDamagePhoto = typeof damagePhotos.$inferInsert
export type RepairEstimate = typeof repairEstimates.$inferSelect
export type NewRepairEstimate = typeof repairEstimates.$inferInsert