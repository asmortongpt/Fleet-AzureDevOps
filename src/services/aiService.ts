/**
 * AI Service - Server-Side Integration (Production-Ready)
 *
 * IMPORTANT:
 * - No LLM API keys are used in the browser.
 * - All AI traffic goes through the backend (audited, rate-limited, and policy-controlled).
 *
 * Backend routes used:
 * - POST /api/ai-chat/sessions
 * - POST /api/ai-chat/chat
 * - POST /api/ai-chat/chat/stream (SSE)
 */

import { secureFetch } from '@/hooks/use-api';
import logger from '@/utils/logger';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// Retained for UI compatibility. Backend currently selects the configured provider/model.
export type AIModel = 'claude' | 'openai' | 'gemini';

export interface AIResponse {
  content: string;
  model: AIModel;
  error?: string;
}

export interface StreamCallback {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

type SessionId = string;

const sessionsByHub = new Map<string, SessionId>();

function buildSystemPrompt(hubType: string) {
  const base = `You are a Fleet Management Assistant.\n\n` +
    `Provide concise, actionable answers. Prefer bullet points when helpful.\n` +
    `If you don't have enough information, ask 1-2 clarifying questions.`;

  switch (hubType) {
    case 'maintenance':
      return `${base}\n\nFocus: maintenance scheduling, work orders, inspection readiness, and cost containment.`;
    case 'operations':
      return `${base}\n\nFocus: dispatch, routing, utilization, and operational KPIs.`;
    case 'assets':
      return `${base}\n\nFocus: asset lifecycle, utilization, replacement planning, and downtime reduction.`;
    case 'safety':
      return `${base}\n\nFocus: safety compliance, incident reduction, training, and audit readiness.`;
    default:
      return `${base}\n\nFocus: fleet overview, analytics, and cross-functional recommendations.`;
  }
}

export function generateContextPrompt(hubType: string, userMessage: string): string {
  // Keep user message intact; hub context is carried in the session system prompt.
  return userMessage;
}

async function ensureSession(hubType: string): Promise<SessionId> {
  const existing = sessionsByHub.get(hubType);
  if (existing) return existing;

  const response = await secureFetch('/api/ai-chat/sessions', {
    method: 'POST',
    body: JSON.stringify({
      title: `Fleet AI (${hubType})`,
      systemPrompt: buildSystemPrompt(hubType),
      documentIds: [],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to create AI session (${response.status}): ${text || response.statusText}`);
  }

  const data = await response.json();
  const sessionId = String(data?.session?.id ?? '');
  if (!sessionId) {
    throw new Error('Failed to create AI session: missing session id');
  }

  sessionsByHub.set(hubType, sessionId);
  return sessionId;
}

function parseSseLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  return trimmed.slice('data:'.length).trim();
}

async function streamSseResponse(response: Response, streamCallback: StreamCallback) {
  if (!response.body) {
    throw new Error('Streaming response missing body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const data = parseSseLine(line);
        if (!data) continue;

        if (data === '[DONE]') {
          streamCallback.onComplete(full);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed?.error) {
            throw new Error(parsed.error);
          }
          const content = String(parsed?.content ?? '');
          if (content) {
            full += content;
            streamCallback.onChunk(content);
          }
        } catch (e) {
          // If the backend ever emits non-JSON data: treat as raw content.
          const raw = data;
          if (raw) {
            full += raw;
            streamCallback.onChunk(raw);
          }
        }
      }
    }

    // If the stream ended without [DONE], treat as complete.
    streamCallback.onComplete(full);
  } catch (e) {
    streamCallback.onError(e as Error);
    throw e;
  }
}

/**
 * Send a message to the backend AI chat.
 *
 * Notes:
 * - `model` is retained for UI compatibility; backend chooses the configured model/provider.
 * - `history` is currently not sent explicitly; backend tracks history via sessionId.
 */
export async function sendMessage(
  message: string,
  model: AIModel,
  _history: Message[] = [],
  streamCallback?: StreamCallback,
  hubType: string = 'general'
): Promise<AIResponse> {
  // The UI still exposes multiple models. Don’t pretend it changes anything yet.
  if (model !== 'openai') {
    logger.warn('[AI] UI requested non-server model; backend will use configured provider', { requested: model });
  }

  const sessionId = await ensureSession(hubType);

  if (streamCallback) {
    const response = await secureFetch('/api/ai-chat/chat/stream', {
      method: 'POST',
      headers: { Accept: 'text/event-stream' },
      body: JSON.stringify({
        sessionId,
        message,
        includeHistory: true,
        maxHistoryMessages: 10,
        searchDocuments: false,
        maxSources: 0,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`AI streaming failed (${response.status}): ${text || response.statusText}`);
    }

    await streamSseResponse(response, streamCallback);
    return { content: '', model: 'openai' };
  }

  const response = await secureFetch('/api/ai-chat/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      message,
      includeHistory: true,
      maxHistoryMessages: 10,
      searchDocuments: false,
      maxSources: 0,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`AI chat failed (${response.status}): ${text || response.statusText}`);
  }

  const data = await response.json();
  return { content: String(data?.message ?? ''), model: 'openai' };
}

/**
 * Testing/diagnostics helper: drop cached sessions.
 */
export function __resetAiSessionsForTests() {
  sessionsByHub.clear();
}

