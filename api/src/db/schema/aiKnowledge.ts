import { pgTable, text, timestamp, uuid, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { vector } from "pgvector/drizzle-orm";

export const documents = pgTable("ai_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: text("org_id").notNull(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  docType: text("doc_type").notNull(),
  version: integer("version").notNull().default(1),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const documentChunks = pgTable("ai_document_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id),
  orgId: text("org_id").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  tokenCount: integer("token_count").notNull().default(0),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documentAcl = pgTable("ai_document_acl", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id),
  orgId: text("org_id").notNull(),
  allowRole: text("allow_role"),
  allowUserId: text("allow_user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ragCache = pgTable("ai_rag_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: text("org_id").notNull(),
  cacheKey: text("cache_key").notNull(),
  response: jsonb("response").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});
