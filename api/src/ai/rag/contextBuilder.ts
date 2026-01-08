import { RetrievedChunk } from "./retriever";

export function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (!chunks.length) return "No relevant internal context was retrieved.";

  return chunks
    .map((c, i) => `[#${i + 1}] SOURCE: ${c.source}\n${c.text}`)
    .join("\n\n");
}
