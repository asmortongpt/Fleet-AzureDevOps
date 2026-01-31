/**
 * AI Chat Panel - Enhanced with Real API Integration
 *
 * Features:
 * - Multi-model support (Claude, OpenAI, Gemini)
 * - Streaming responses
 * - Context-aware fleet insights
 * - Chat history management
 * - Copy responses
 * - Clear chat
 * - Model selection
 * - Error handling
 *
 * Created: 2025-01-03
 */

import { Send, Bot, User, Sparkles, Copy, Trash2, Check, AlertCircle } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import toast from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logger from '@/utils/logger';
import {
  sendMessage,
  generateContextPrompt,
  type Message,
  type AIModel,
  type StreamCallback
} from '@/services/aiService';

interface AIChatPanelProps {
  hubType?: string;
  onClose?: () => void;
}

export function AIChatPanel({ hubType = 'general', onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your Fleet Intelligence Assistant powered by AI. I can help you with:\n\n• Vehicle maintenance scheduling and tracking\n• Route optimization and fuel efficiency\n• Cost analysis and budget forecasting\n• Safety compliance and driver performance\n• Real-time operations and dispatching\n\nWhat would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('claude');
  const [streamingContent, setStreamingContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const sendUserMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    // Create context-aware prompt
    const contextPrompt = generateContextPrompt(hubType, currentInput);

    // Stream callback
    const streamCallback: StreamCallback = {
      onChunk: (chunk: string) => {
        setStreamingContent(prev => prev + chunk);
      },
      onComplete: (fullResponse: string) => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setStreamingContent('');
        setIsLoading(false);
      },
      onError: (error: Error) => {
        logger.error('Streaming error:', error);
        toast.error('AI Error', {
          description: error.message || 'Failed to get response from AI'
        });
        setStreamingContent('');
        setIsLoading(false);
      }
    };

    try {
      // Send message to AI with streaming
      await sendMessage(
        contextPrompt,
        selectedModel,
        messages.filter(m => m.role !== 'system'),
        streamCallback
      );
    } catch (error) {
      logger.error('AI error:', error);
      toast.error('AI Error', {
        description: error instanceof Error ? error.message : 'Failed to send message'
      });
      setIsLoading(false);
      setStreamingContent('');

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or switch to a different AI model.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your Fleet Intelligence Assistant. How can I help you today?`,
        timestamp: new Date()
      }
    ]);
    toast.success('Chat cleared');
  };

  const QuickAction = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="text-xs"
      disabled={isLoading}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      {label}
    </Button>
  );

  const quickActions = {
    maintenance: [
      { label: 'Maintenance Due', prompt: 'Which vehicles need maintenance soon?' },
      { label: 'Cost Analysis', prompt: 'Show me maintenance cost analysis for this month' },
      { label: 'Work Orders', prompt: 'What are the urgent work orders?' },
      { label: 'Service Schedule', prompt: 'Optimize the maintenance schedule' }
    ],
    operations: [
      { label: 'Active Routes', prompt: 'Show me current active routes and efficiency' },
      { label: 'Dispatch Status', prompt: 'What is the dispatch status today?' },
      { label: 'Route Optimize', prompt: 'Suggest route optimizations to save fuel' },
      { label: 'Fleet Utilization', prompt: 'Analyze fleet utilization rates' }
    ],
    assets: [
      { label: 'Asset Overview', prompt: 'Give me an overview of fleet assets' },
      { label: 'Depreciation', prompt: 'Show vehicle depreciation trends' },
      { label: 'Utilization', prompt: 'Which assets are underutilized?' },
      { label: 'Replacement', prompt: 'Which vehicles should be replaced soon?' }
    ],
    safety: [
      { label: 'Safety Alerts', prompt: 'Show me current safety alerts and violations' },
      { label: 'Driver Scores', prompt: 'Analyze driver safety scores' },
      { label: 'Compliance', prompt: 'What compliance issues need attention?' },
      { label: 'Incident Trends', prompt: 'Show incident trends and patterns' }
    ],
    general: [
      { label: 'Fleet Status', prompt: 'Give me a fleet status overview' },
      { label: 'Cost Report', prompt: 'Summarize costs for this month' },
      { label: 'Performance', prompt: 'Analyze overall fleet performance' },
      { label: 'Recommendations', prompt: 'What improvements do you recommend?' }
    ]
  };

  const currentQuickActions = quickActions[hubType as keyof typeof quickActions] || quickActions.general;

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Fleet AI Assistant
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as AIModel)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">Claude 3.5</SelectItem>
                  <SelectItem value="openai">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gemini">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={isLoading}
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {currentQuickActions.map((action, idx) => (
              <QuickAction
                key={idx}
                label={action.label}
                onClick={() => setInput(action.prompt)}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-2" ref={scrollRef}>
            <div className="space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs opacity-70">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                      {msg.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {streamingContent && (
                <div className="flex gap-3">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <p className="text-sm whitespace-pre-line">{streamingContent}</p>
                    <div className="flex gap-1 mt-2">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                    </div>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && !streamingContent && (
                <div className="flex gap-3">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Powered by {selectedModel === 'claude' ? 'Claude 3.5 Sonnet' : selectedModel === 'openai' ? 'GPT-4 Turbo' : 'Gemini Pro'}
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask about fleet operations, maintenance, costs, routes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendUserMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendUserMessage} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
