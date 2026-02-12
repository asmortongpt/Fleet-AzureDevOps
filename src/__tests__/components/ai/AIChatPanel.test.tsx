import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AIChatPanel } from '@/components/ai/AIChatPanel';

vi.mock('@/services/aiService', () => ({
  generateContextPrompt: (_hubType: string, userMessage: string) => userMessage,
  sendMessage: vi.fn(async (_message: string, _model: string, _history: any[], stream: any) => {
    // Simulate a streamed response.
    if (stream) {
      stream.onChunk('Hello');
      stream.onChunk(' world');
      stream.onComplete('Hello world');
    }
    return { content: 'Hello world', model: 'openai' };
  }),
}));

describe('AIChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the panel with initial assistant message', () => {
    render(<AIChatPanel />);
    expect(screen.getByText(/Fleet AI Assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/Ask a question to get started/i)).toBeInTheDocument();
  });

  it('sends a message and appends the assistant response', async () => {
    const user = userEvent.setup();
    render(<AIChatPanel hubType="general" />);

    const input = screen.getByPlaceholderText(/Ask about fleet operations/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
  });
});
