/**
 * Model Router
 * Production implementation for OpenAI / Azure OpenAI / Anthropic
 */

import { OpenAI } from 'openai';
import { AI_CONFIG } from '../config';
import logger from '../../config/logger';

// Initialize OpenAI client based on provider
const getOpenAIClient = () => {
  const provider = AI_CONFIG.provider?.toLowerCase() || 'openai';

  if (provider === 'azure' || provider === 'azure-openai') {
    return new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview' },
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
    });
  }

  // Default to OpenAI
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export type ModelCall = {
  model: string;
  input: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
};

export type EmbeddingCall = {
  model: string;
  input: string;
};

/**
 * Call LLM for chat completion
 * Supports OpenAI and Azure OpenAI
 */
export async function callLLM({
  model,
  input,
  systemPrompt,
  temperature = 0.7,
  maxTokens = 1000
}: ModelCall): Promise<string> {
  try {
    const client = getOpenAIClient();

    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: input });

    const completion = await client.chat.completions.create({
      model: model || AI_CONFIG.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    return content;
  } catch (error) {
    logger.error('[callLLM] Error', { error: error instanceof Error ? error.message : String(error) });
    throw new Error(`LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for text
 * Supports OpenAI and Azure OpenAI embeddings
 */
export async function callEmbeddings({ model, input }: EmbeddingCall): Promise<number[]> {
  try {
    const client = getOpenAIClient();

    const response = await client.embeddings.create({
      model: model || AI_CONFIG.embeddingModel,
      input,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding || embedding.length === 0) {
      throw new Error('Empty embedding response');
    }

    return embedding;
  } catch (error) {
    logger.error('[callEmbeddings] Error', { error: error instanceof Error ? error.message : String(error) });
    throw new Error(`Embeddings call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
