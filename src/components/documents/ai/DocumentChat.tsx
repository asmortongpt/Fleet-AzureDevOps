/**
 * DocumentChat - Q&A interface with streaming responses
 * Features: Chat with document, citations, streaming AI responses
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, FileText, Loader2, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChatMessage, DocumentMetadata } from '@/lib/documents/types';

interface DocumentChatProps {
  document: DocumentMetadata;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export function DocumentChat({ document, messages, onSendMessage, isLoading = false }: DocumentChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const suggestedQuestions = [
    'What is this document about?',
    'Summarize the key points',
    'What dates are mentioned?',
    'Are there any action items?',
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Ask AI</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Ask questions about "{document.name}"
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Start a conversation about this document
              </p>
              <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                {suggestedQuestions.map((question, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start"
                    onClick={() => onSendMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} document={document} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask a question about this document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[80px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, document }: { message: ChatMessage; document: DocumentMetadata }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg p-3">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] bg-muted rounded-lg p-3 space-y-3">
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {message.citations && message.citations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Sources</div>
              {message.citations.map((citation, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 bg-background rounded text-xs"
                >
                  <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{document.name}</div>
                    {citation.page && (
                      <div className="text-muted-foreground">Page {citation.page}</div>
                    )}
                    <div className="mt-1 italic text-muted-foreground line-clamp-2">
                      "{citation.text}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
