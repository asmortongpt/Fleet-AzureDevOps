/**
 * Model Router
 * Implement this file to call OpenAI / Azure OpenAI / internal model gateway.
 * The rest of the AI platform calls this module only.
 */

export type ModelCall = {
  model: string;
  input: string;
};

export type EmbeddingCall = {
  model: string;
  input: string;
};

export async function callLLM({ model, input }: ModelCall): Promise<string> {
  // TODO: Replace with your provider call. This placeholder expects an internal endpoint.
  // Example: POST http://localhost:PORT/internal/ai/chat
  throw new Error("callLLM not implemented. Wire this to OpenAI/Azure OpenAI.");
}

export async function callEmbeddings({ model, input }: EmbeddingCall): Promise<number[]> {
  // TODO: Replace with your provider call.
  throw new Error("callEmbeddings not implemented. Wire this to OpenAI/Azure OpenAI.");
}
