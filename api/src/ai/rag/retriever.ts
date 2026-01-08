import { sql } from "drizzle-orm";
import { db } from "../../db"; // adjust import to your db init
import { UserContext } from "../gateway/policy";

/**
 * NOTE:
 * This file uses a raw SQL query for pgvector cosine distance (<=>).
 * Replace table names if needed or use Drizzle schema objects.
 */

export type RetrievedChunk = {
  id: string;
  text: string;
  source: string;
  score: number;
  documentId: string;
  metadata?: Record<string, any>;
};

export async function retrieveChunks(params: {
  user: UserContext;
  queryEmbedding: number[];
  topK: number;
}): Promise<RetrievedChunk[]> {
  const { user, queryEmbedding, topK } = params;

  const roles = user.roles ?? [];
  const embeddingLiteral = `[${queryEmbedding.join(",")}]`;

  const rows = await db.execute(sql`
    SELECT
      c.id as chunk_id,
      c.content as content,
      d.source as source,
      d.id as document_id,
      (1 - (c.embedding <=> ${embeddingLiteral}::vector)) as score
    FROM ai_document_chunks c
    JOIN ai_documents d ON d.id = c.document_id
    LEFT JOIN ai_document_acl acl ON acl.document_id = d.id
    WHERE
      d.org_id = ${user.orgId}
      AND d.is_active = true
      AND (
        acl.id IS NULL
        OR acl.allow_user_id = ${user.userId}
        OR acl.allow_role = ANY(${roles}::text[])
      )
    ORDER BY c.embedding <=> ${embeddingLiteral}::vector ASC
    LIMIT ${topK};
  `);

  const resultRows: any[] = (rows as any).rows ?? (rows as any) ?? [];
  return resultRows.map((r) => ({
    id: r.chunk_id,
    text: r.content,
    source: r.source,
    score: Number(r.score ?? 0),
    documentId: r.document_id,
  }));
}
