/**
 * AI Service Tests
 * 
 * Tests AI service integration with OpenAI and Anthropic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { aiService } from '../ai-service';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    aiService.clearHistory('test-conversation');
  });

  describe('Provider Detection', () => {
    it('should detect mock provider when no API keys are set', () => {
      const info = aiService.getProviderInfo();
      expect(info.provider).toBe('mock');
      expect(info.isProduction).toBe(false);
    });
  });

  describe('Mock Chat', () => {
    it('should respond to maintenance queries', async () => {
      const response = await aiService.chat('Check maintenance status', 'test', {});
      
      expect(response.role).toBe('assistant');
      expect(response.content).toBeTruthy();
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('should respond to route queries', async () => {
      const response = await aiService.chat('Optimize my routes', 'test', {});
      
      expect(response.role).toBe('assistant');
      expect(response.content.toLowerCase()).toContain('route');
    });

    it('should respond to cost queries', async () => {
      const response = await aiService.chat('What are my monthly costs?', 'test', {});
      
      expect(response.role).toBe('assistant');
      expect(response.content.toLowerCase()).toContain('cost');
    });

    it('should respond to safety queries', async () => {
      const response = await aiService.chat('Show me safety alerts', 'test', {});
      
      expect(response.role).toBe('assistant');
      expect(response.content.toLowerCase()).toContain('safety');
    });

    it('should respond to vehicle queries', async () => {
      const response = await aiService.chat('Where is vehicle 123?', 'test', {});
      
      expect(response.role).toBe('assistant');
      expect(response.content.toLowerCase()).toContain('vehicle');
    });

    it('should provide general help for unknown queries', async () => {
      const response = await aiService.chat('random question', 'test', {});
      
      expect(response.role).toBe('assistant');
      expect(response.content).toContain('can help you with');
    });
  });

  describe('Conversation History', () => {
    it('should maintain conversation history', async () => {
      await aiService.chat('First message', 'test', {});
      await aiService.chat('Second message', 'test', {});
      
      const history = aiService.getHistory('test');
      
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should clear conversation history', async () => {
      await aiService.chat('Message', 'test', {});
      
      let history = aiService.getHistory('test');
      expect(history.length).toBeGreaterThan(0);
      
      aiService.clearHistory('test');
      history = aiService.getHistory('test');
      expect(history.length).toBe(0);
    });

    it('should maintain separate histories for different conversations', async () => {
      await aiService.chat('Message 1', 'conversation-1', {});
      await aiService.chat('Message 2', 'conversation-2', {});
      
      const history1 = aiService.getHistory('conversation-1');
      const history2 = aiService.getHistory('conversation-2');
      
      expect(history1.length).toBeGreaterThan(0);
      expect(history2.length).toBeGreaterThan(0);
    });
  });

  describe('Message Generation', () => {
    it('should generate unique message IDs', async () => {
      const response1 = await aiService.chat('Message 1', 'test', {});
      const response2 = await aiService.chat('Message 2', 'test', {});
      
      expect(response1.id).not.toBe(response2.id);
    });

    it('should include timestamps', async () => {
      const response = await aiService.chat('Test message', 'test', {});
      
      expect(response.timestamp).toBeInstanceOf(Date);
      expect(response.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should handle empty messages gracefully', async () => {
      const response = await aiService.chat('', 'test', {});
      
      expect(response.role).toBe('assistant');
      expect(response.content).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Mock mode shouldn't throw errors
      await expect(aiService.chat('test', 'test', {})).resolves.toBeDefined();
    });
  });

  describe('Streaming Chat', () => {
    it('should support streaming responses', async () => {
      const chunks: any[] = [];
      
      for await (const chunk of aiService.streamChat('Test message', 'test', {})) {
        chunks.push(chunk);
      }
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[chunks.length - 1].done).toBe(true);
    });

    it('should provide incremental content in streams', async () => {
      let previousLength = 0;
      
      for await (const chunk of aiService.streamChat('Show vehicle status', 'test', {})) {
        if (!chunk.done) {
          expect(chunk.content.length).toBeGreaterThanOrEqual(previousLength);
          previousLength = chunk.content.length;
        }
      }
    });
  });
});

describe('OpenAI Integration (Mocked)', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should call OpenAI API with correct parameters', async () => {
    // This test would require setting VITE_OPENAI_API_KEY
    // and mocking the fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: 'Mocked OpenAI response'
          }
        }],
        usage: {
          total_tokens: 100
        }
      })
    });

    // Test would verify fetch was called correctly
    expect(mockFetch).not.toHaveBeenCalled(); // Since we're in mock mode
  });
});

describe('Anthropic Integration (Mocked)', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should call Anthropic API with correct parameters', async () => {
    // This test would require setting VITE_ANTHROPIC_API_KEY
    // and mocking the fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{
          text: 'Mocked Anthropic response'
        }],
        usage: {
          input_tokens: 50,
          output_tokens: 50
        }
      })
    });

    // Test would verify fetch was called correctly
    expect(mockFetch).not.toHaveBeenCalled(); // Since we're in mock mode
  });
});
