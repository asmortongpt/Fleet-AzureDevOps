export const AI_CONFIG = {
  provider: process.env.AI_PROVIDER ?? "openai",
  model: process.env.AI_MODEL ?? "gpt-4o-mini",
  embeddingModel: process.env.AI_EMBED_MODEL ?? "text-embedding-3-small",
  embeddingDimensions: Number(process.env.AI_EMBED_DIMS ?? 1536),

  // RAG
  topK: Number(process.env.AI_RAG_TOPK ?? 8),
  maxContextTokens: Number(process.env.AI_MAX_CONTEXT_TOKENS ?? 2400),

  // Caching
  redisUrl: process.env.REDIS_URL ?? "",
  cacheTtlSeconds: Number(process.env.AI_CACHE_TTL ?? 3600),

  // Guardrails
  requireCitations: true,
  allowToolExecutionByDefault: (process.env.AI_ALLOW_TOOLS ?? "false") === "true",
};
