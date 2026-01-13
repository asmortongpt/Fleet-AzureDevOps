import { AI_CONFIG } from "../config";
import { callEmbeddings } from "../gateway/modelRouter";

export async function embedText(text: string): Promise<number[]> {
  return callEmbeddings({ model: AI_CONFIG.embeddingModel, input: text });
}
