import { pgTable, uuid, text, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define status enum
export const statusEnum = pgEnum('camera_status', ['active', 'inactive', 'maintenance']);

// Traffic cameras table schema
export const trafficCameras = pgTable('traffic_cameras', {
  id: uuid('id').primaryKey().defaultRandom(),
  fl511_id: text('fl511_id').notNull().unique(),
  name: text('name').notNull(),
  route: text('route').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  image_url: text('image_url').notNull(),
  status: statusEnum('status').notNull().default('active'),
  last_updated: timestamp('last_updated').notNull().defaultNow(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

export type TrafficCamera = typeof trafficCameras.$inferSelect;
export type NewTrafficCamera = typeof trafficCameras.$inferInsert;
