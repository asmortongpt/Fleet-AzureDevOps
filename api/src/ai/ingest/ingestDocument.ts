import { db } from "../../db"; // adjust import
import { sql } from "drizzle-orm";
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

  const insertDoc = await db.execute(sql`
    INSERT INTO ai_documents (org_id, title, source, doc_type, metadata, version, is_active, created_at, updated_at)
    VALUES (${orgId}, ${title}, ${source}, ${docType}, ${JSON.stringify(metadata ?? {})}::jsonb, 1, true, now(), now())
    RETURNING id
  `);
  const docId = ((insertDoc as any).rows?.[0]?.id) ?? (insertDoc as any)[0]?.id;

  const chunks = chunkText(content);
  const embeddings = await Promise.all(chunks.map((c) => embedText(c)));

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const emb = embeddings[i];
    await db.execute(sql`
      INSERT INTO ai_document_chunks (org_id, document_id, chunk_index, content, embedding, token_count, metadata, created_at)
      VALUES (${orgId}, ${docId}, ${i}, ${chunk}, ${"[" + emb.join(",") + "]"}::vector, ${Math.ceil(chunk.length / 4)}, '{}'::jsonb, now())
    `);
  }

  return { id: docId };
}
