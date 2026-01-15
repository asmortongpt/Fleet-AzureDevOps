-- Migration: Add RAG embedding support to ai_conversations
-- Description: Adds embedding column for vector storage and similarity search
-- Date: 2025-11-09

-- Add embedding column to ai_conversations table
-- Storing as JSONB since we're using MemoryVectorStore backed by PostgreSQL
ALTER TABLE ai_conversations
ADD COLUMN IF NOT EXISTS embedding JSONB DEFAULT NULL;

-- Add index on embedding for faster RAG queries
CREATE INDEX IF NOT EXISTS idx_ai_conversations_embedding ON ai_conversations USING gin (embedding);

-- Add updated_at trigger for embedding updates
CREATE OR REPLACE FUNCTION update_ai_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_conversations_embedding_update
BEFORE UPDATE ON ai_conversations
FOR EACH ROW
WHEN (OLD.embedding IS DISTINCT FROM NEW.embedding)
EXECUTE FUNCTION update_ai_conversation_timestamp();

-- Add comment to explain column
COMMENT ON COLUMN ai_conversations.embedding IS 'OpenAI text-embedding-ada-002 vector representation stored as JSONB array for RAG similarity search';

-- Migration complete
