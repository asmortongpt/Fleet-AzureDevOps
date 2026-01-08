import { RetrievedChunk } from "./retriever";

export type Citation = {
  id: string;
  source: string;
  snippet: string;
  score?: number;
};

export function buildCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks.map((c) => ({
    id: c.id,
    source: c.source,
    snippet: c.text.slice(0, 240),
    score: c.score,
  }));
}
