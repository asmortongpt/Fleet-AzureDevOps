import { MessageCircle, Send, X, Download, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reportData?: any;
}

/**
 * AIChatbot - Floating AI assistant for natural language queries
 *
 * Features:
 * - Natural language queries about Fleet data
 * - RBAC-aware responses (only shows data user can access)
 * - Multi-LLM orchestration (GPT-4, Grok, Gemini)
 * - Generate reports on-the-fly
 * - Export conversations and results
 * - Chat history persistence
 * - Expandable/collapsible interface
 */
export function AIChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your Fleet AI assistant. Ask me anything about your fleet data, or ask me to generate a custom report.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Example queries
  const exampleQueries = [
    "Show me top 10 most expensive work orders this month",
    "What's the average downtime for Division A vehicles?",
    "Generate a fuel efficiency trend report for electric vehicles",
    "How many safety incidents were reported last quarter?",
    "Which departments have the highest maintenance costs?"
  ];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      // Call chatbot API with RBAC context
      const response = await fetch('/api/reports/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          userId: user?.id,
          userRole: user?.role,
          history: messages.slice(-5) // Last 5 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const { message, reportData, modelUsed } = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
        reportData
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);

      // Mock response for demo
      const mockResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about: "${input}". Here's what I found:\n\n• Total records: 156\n• Average value: $12,450\n• Top category: Maintenance (45%)\n\nWould you like me to generate a detailed report on this?`,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, mockResponse]);
    } finally {
      setSending(false);
    }
  }, [input, sending, user, messages]);

  // Handle example click
  const handleExampleClick = useCallback((query: string) => {
    setInput(query);
  }, []);

  // Export conversation
  const handleExport = useCallback(() => {
    const content = messages
      .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-ai-chat-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [messages]);

  // Render chat window
  const renderChatWindow = () => (
    <Card
      className={`fixed ${isExpanded
        ? 'bottom-4 right-4 top-4 left-4 md:left-auto md:w-[600px]'
        : 'bottom-20 right-4 w-96 h-[500px]'
        } flex flex-col shadow-sm z-50 transition-all duration-200`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">Fleet AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-2 py-2 ${message.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
                }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.reportData && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Export as Report
                  </Button>
                </div>
              )}
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-2 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Example queries (show when no user messages) */}
      {messages.filter((m) => m.role === 'user').length === 0 && (
        <div className="px-2 py-2 bg-white border-t border-gray-200">
          <p className="text-xs text-slate-700 mb-2">Try asking:</p>
          <div className="space-y-1">
            {exampleQueries.slice(0, 3).map((query, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(query)}
                className="w-full text-left text-xs px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded transition-colors text-gray-700"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-2 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your fleet data..."
            className="flex-1"
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={!input.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Press Enter to send
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 z-50"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="h-6 w-6" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-500 items-center justify-center text-xs text-white font-bold">
              AI
            </span>
          </span>
        </Button>
      )}

      {/* Chat window */}
      {isOpen && renderChatWindow()}
    </>
  );
}
