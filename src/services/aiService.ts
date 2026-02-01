/**
 * AI Service - Real API Integration
 *
 * Provides integration with Claude (Anthropic), OpenAI, and Gemini APIs
 * for intelligent fleet management insights.
 *
 * Features:
 * - Multi-model support (Claude, OpenAI, Gemini)
 * - Streaming responses
 * - Context-aware fleet insights
 * - Error handling and fallbacks
 *
 * Created: 2025-01-03
 */

import logger from '@/utils/logger';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

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

// Get API keys from environment variables
const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// System prompt for fleet context
const FLEET_SYSTEM_PROMPT = `You are an intelligent fleet management assistant. You help fleet managers with:
- Vehicle maintenance scheduling and tracking
- Route optimization and fuel efficiency
- Cost analysis and budget forecasting
- Safety compliance and driver performance
- Real-time fleet operations and dispatching
- Work order management and garage operations

Provide concise, actionable insights. When analyzing data, focus on practical recommendations.
Use bullet points for clarity. Be proactive in suggesting improvements.`;

/**
 * Send message to Claude API (Anthropic)
 */
export async function sendMessageToClaude(
  message: string,
  history: Message[] = [],
  streamCallback?: StreamCallback
): Promise<AIResponse> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  try {
    // Build messages array with history
    const messages = [
      ...history.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: FLEET_SYSTEM_PROMPT,
        messages: messages,
        stream: !!streamCallback
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API request failed');
    }

    // Handle streaming response
    if (streamCallback && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta') {
                  const text = parsed.delta?.text || '';
                  fullResponse += text;
                  streamCallback.onChunk(text);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        streamCallback.onComplete(fullResponse);
        return { content: fullResponse, model: 'claude' };
      } catch (error) {
        streamCallback.onError(error as Error);
        throw error;
      }
    }

    // Handle non-streaming response
    const data = await response.json();
    const content = data.content?.[0]?.text || 'No response generated';

    return {
      content,
      model: 'claude'
    };
  } catch (error) {
    logger.error('Claude API error:', error);
    return {
      content: '',
      model: 'claude',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send message to OpenAI API
 */
export async function sendMessageToOpenAI(
  message: string,
  history: Message[] = [],
  streamCallback?: StreamCallback
): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Build messages array with system prompt and history
    const messages = [
      {
        role: 'system',
        content: FLEET_SYSTEM_PROMPT
      },
      ...history.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        max_tokens: 4096,
        temperature: 0.7,
        stream: !!streamCallback
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    // Handle streaming response
    if (streamCallback && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices?.[0]?.delta?.content || '';
                if (text) {
                  fullResponse += text;
                  streamCallback.onChunk(text);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        streamCallback.onComplete(fullResponse);
        return { content: fullResponse, model: 'openai' };
      } catch (error) {
        streamCallback.onError(error as Error);
        throw error;
      }
    }

    // Handle non-streaming response
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response generated';

    return {
      content,
      model: 'openai'
    };
  } catch (error) {
    logger.error('OpenAI API error:', error);
    return {
      content: '',
      model: 'openai',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send message to Google Gemini API
 */
export async function sendMessageToGemini(
  message: string,
  history: Message[] = [],
  streamCallback?: StreamCallback
): Promise<AIResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  try {
    // Build contents array with history
    const contents = [
      {
        role: 'user',
        parts: [{ text: FLEET_SYSTEM_PROMPT }]
      },
      ...history
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const endpoint = streamCallback
      ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent?key=${GEMINI_API_KEY}`
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API request failed');
    }

    // Handle streaming response
    if (streamCallback && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);

          try {
            const parsed = JSON.parse(chunk);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullResponse += text;
              streamCallback.onChunk(text);
            }
          } catch {
            // Skip invalid JSON
          }
        }

        streamCallback.onComplete(fullResponse);
        return { content: fullResponse, model: 'gemini' };
      } catch (error) {
        streamCallback.onError(error as Error);
        throw error;
      }
    }

    // Handle non-streaming response
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return {
      content,
      model: 'gemini'
    };
  } catch (error) {
    logger.error('Gemini API error:', error);
    return {
      content: '',
      model: 'gemini',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send message to the specified AI model
 */
export async function sendMessage(
  message: string,
  model: AIModel = 'claude',
  history: Message[] = [],
  streamCallback?: StreamCallback
): Promise<AIResponse> {
  switch (model) {
    case 'claude':
      return sendMessageToClaude(message, history, streamCallback);
    case 'openai':
      return sendMessageToOpenAI(message, history, streamCallback);
    case 'gemini':
      return sendMessageToGemini(message, history, streamCallback);
    default:
      throw new Error(`Unsupported AI model: ${model}`);
  }
}

/**
 * Generate a context-aware prompt based on the hub
 */
export function generateContextPrompt(hubType: string, userMessage: string): string {
  const contextPrefixes: Record<string, string> = {
    maintenance: 'Regarding fleet maintenance: ',
    operations: 'Regarding fleet operations: ',
    assets: 'Regarding fleet assets: ',
    safety: 'Regarding fleet safety: ',
    communication: 'Regarding fleet communications: ',
    procurement: 'Regarding fleet procurement: ',
    reports: 'Regarding fleet reports: '
  };

  const prefix = contextPrefixes[hubType] || '';
  return prefix + userMessage;
}
