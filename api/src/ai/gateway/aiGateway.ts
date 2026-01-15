import { AI_CONFIG } from "../config";
import { redactPII } from "./redaction";
import { auditLog } from "./audit";
import { enforceAIPolicy, UserContext } from "./policy";
import { runRagPipeline } from "../rag/ragPipeline";
import { getCache, setCache } from "../cag/cache";

export async function chatWithAI(params: {
  user: UserContext;
  message: string;
  enableRag?: boolean;
}): Promise<{ answer: string; citations: any[] }> {
  const { user, message, enableRag = true } = params;

  const policy = enforceAIPolicy(user, { intent: "chat" });
  if (!policy.allow) return { answer: `Access denied: ${policy.reason}`, citations: [] };

  const sanitized = redactPII(message);
  const cacheKey = `ai:chat:${user.orgId}:${hash(sanitized)}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const result = enableRag ? await runRagPipeline({ user, query: sanitized }) : { answer: "RAG disabled", citations: [] };

  await auditLog({
    eventType: "ai.chat",
    timestamp: new Date().toISOString(),
    userId: user.userId,
    orgId: user.orgId,
    payload: { query: sanitized, citations: result.citations?.length ?? 0 },
  });

  await setCache(cacheKey, result, AI_CONFIG.cacheTtlSeconds);
  return result;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16);
}
