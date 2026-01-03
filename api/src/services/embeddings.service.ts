/**
 * Embeddings service wrapper for backward compatibility
 * Wraps the EmbeddingService class instance
 */

import EmbeddingService from './EmbeddingService'

/**
 * Generate embedding for a single text
 */
export async function embed(text: string): Promise<number[]> {
  return EmbeddingService.embed(text)
}

/**
 * Generate embeddings for multiple texts
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  return EmbeddingService.embedBatch(texts)
}

/**
 * Export the service instance for direct access
 */
export default EmbeddingService
