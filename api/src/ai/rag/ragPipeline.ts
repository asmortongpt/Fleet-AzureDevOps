import { AI_CONFIG } from "../config";
import { UserContext } from "../gateway/policy";
import { callLLM } from "../gateway/modelRouter";
import { buildChatPrompt } from "../gateway/prompts";
import { embedText } from "./embeddings";
import { retrieveChunks } from "./retriever";
import { rerank } from "./reranker";
import { buildContextBlock } from "./contextBuilder";
import { buildCitations } from "./citations";

export async function runRagPipeline(params: {
  user: UserContext;
  query: string;
}): Promise<{ answer: string; citations: any[] }> {
  const { user, query } = params;

  const queryEmbedding = await embedText(query);
  const chunks = await retrieveChunks({ user, queryEmbedding, topK: AI_CONFIG.topK });
  const ranked = await rerank(query, chunks);

  const context = buildContextBlock(ranked);
  const prompt = buildChatPrompt(query, context);

  const output = await callLLM({ model: AI_CONFIG.model, input: prompt });
  const citations = buildCitations(ranked);

  return { answer: output, citations };
}
