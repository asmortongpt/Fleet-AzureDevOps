import { RetrievedChunk } from "./retriever";

export async function rerank(query: string, chunks: RetrievedChunk[]) {
  // Placeholder: sort by similarity score descending.
  return chunks.sort((a, b) => b.score - a.score);
}
