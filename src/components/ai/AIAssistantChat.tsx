/**
 * AI Assistant Chat Interface - REAL API INTEGRATION
 *
 * Features:
 * - Real-time chat interface with Claude/OpenAI/Gemini
 * - Message history
 * - LLM integration with streaming
 * - Fleet-specific context
 *
 * Updated: 2025-01-03
 */

import { AIChatPanel } from './AIChatPanel';

/**
 * Legacy wrapper component - now uses AIChatPanel
 * @deprecated Use AIChatPanel directly for better control
 */
export function AIAssistantChat({ hubType }: { hubType?: string }) {
  return <AIChatPanel hubType={hubType} />;
}
