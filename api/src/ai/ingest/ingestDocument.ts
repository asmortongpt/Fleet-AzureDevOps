import { pool } from "../../db"; // adjust import
import { chunkText } from "./chunking";
import { embedText } from "../rag/embeddings";

/**
 * Minimal ingestion that inserts into ai_documents + ai_document_chunks.
 * Replace raw SQL with Drizzle schema objects if you prefer.
 */
export async function ingestDocument(params: {
  orgId: string;
  title: string;
  source: string;
  docType: string;
  content: string;
  metadata?: any;
}) {
  const { orgId, title, source, docType, content, metadata } = params;

  const insertDoc = await pool.query(
    `INSERT INTO ai_documents (org_id, title, source, doc_type, metadata, version, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, 1, true, now(), now())
     RETURNING id`,
    [orgId, title, source, docType, JSON.stringify(metadata ?? {})]
  );
  const docId = insertDoc.rows?.[0]?.id;

  const chunks = chunkText(content);
  const embeddings = await Promise.all(chunks.map((c) => embedText(c)));

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const emb = embeddings[i];
    await pool.query(
      `INSERT INTO ai_document_chunks (org_id, document_id, chunk_index, content, embedding, token_count, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5::vector, $6, '{}'::jsonb, now())`,
      [orgId, docId, i, chunk, "[" + emb.join(",") + "]", Math.ceil(chunk.length / 4)]
    );
  }

  return { id: docId };
}
