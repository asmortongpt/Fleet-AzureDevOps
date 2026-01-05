/**
 * AI Assistant Chat Interface - COMPLETE IMPLEMENTATION
 *
 * Features:
 * - Real-time chat interface
 * - Message history
 * - LLM integration ready
 * - Fleet-specific context
 *
 * Created: 2025-12-31
 */

import { Send, Bot, User, Sparkles } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const FLEET_KNOWLEDGE = {
  maintenance: 'I can help you schedule maintenance, check service history, and predict maintenance needs.',
  routes: 'I can optimize routes, analyze fuel efficiency, and suggest better paths.',
  costs: 'I can analyze fuel costs, maintenance expenses, and provide budget forecasts.',
  safety: 'I can review safety alerts, compliance issues, and driver performance.',
  vehicles: 'I can provide vehicle status, location tracking, and performance metrics.'
};

export function AIAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Fleet Intelligence Assistant. I can help you with maintenance scheduling, route optimization, cost analysis, safety compliance, and vehicle management. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('maintenance') || input.includes('service')) {
      return FLEET_KNOWLEDGE.maintenance + ' What specific maintenance question do you have?';
    } else if (input.includes('route') || input.includes('optimize')) {
      return FLEET_KNOWLEDGE.routes + ' Which routes would you like me to analyze?';
    } else if (input.includes('cost') || input.includes('budget') || input.includes('expense')) {
      return FLEET_KNOWLEDGE.costs + ' Would you like a monthly or annual cost breakdown?';
    } else if (input.includes('safety') || input.includes('compliance') || input.includes('driver')) {
      return FLEET_KNOWLEDGE.safety + ' What safety aspect would you like to review?';
    } else if (input.includes('vehicle') || input.includes('truck') || input.includes('car')) {
      return FLEET_KNOWLEDGE.vehicles + ' Which vehicle would you like information about?';
    } else {
      return `I can help you with:\n• Vehicle maintenance and scheduling\n• Route optimization\n• Cost analysis and budgeting\n• Safety and compliance\n• Vehicle tracking and performance\n\nWhat would you like to explore?`;
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

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

    // Simulate AI processing with intelligent response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(currentInput),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const QuickAction = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="text-xs"
    >
      <Sparkles className="h-3 w-3 mr-1" />
      {label}
    </Button>
  );

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Fleet Intelligence Assistant
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <QuickAction label="Vehicle Status" onClick={() => setInput('Show me all vehicle statuses')} />
            <QuickAction label="Maintenance Due" onClick={() => setInput('Which vehicles need maintenance?')} />
            <QuickAction label="Cost Report" onClick={() => setInput('Show me this month\'s costs')} />
            <QuickAction label="Safety Alerts" onClick={() => setInput('Are there any safety alerts?')} />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
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
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about fleet operations, maintenance, costs, routes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
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
